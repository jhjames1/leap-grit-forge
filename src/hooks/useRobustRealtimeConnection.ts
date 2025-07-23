
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
  lastConnected: Date | null;
  retryCount: number;
  error: string | null;
}

interface UseRobustRealtimeConnectionProps {
  sessionId: string | null;
  onMessage?: (payload: any) => void;
  onSessionUpdate?: (payload: any) => void;
  enabled?: boolean;
}

export const useRobustRealtimeConnection = ({
  sessionId,
  onMessage,
  onSessionUpdate,
  enabled = true
}: UseRobustRealtimeConnectionProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    quality: 'unknown',
    lastConnected: null,
    retryCount: 0,
    error: null
  });

  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const pollingFallbackRef = useRef<NodeJS.Timeout>();
  
  const maxRetries = 5;
  const connectionTimeout = 15000; // 15 seconds
  const healthCheckInterval = 30000; // 30 seconds
  const pollingInterval = 5000; // 5 seconds for fallback

  const clearAllTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = undefined;
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = undefined;
    }
    if (pollingFallbackRef.current) {
      clearInterval(pollingFallbackRef.current);
      pollingFallbackRef.current = undefined;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      logger.debug('Cleaning up realtime channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    clearAllTimers();
  }, [clearAllTimers]);

  const startPollingFallback = useCallback(async () => {
    if (!sessionId || pollingFallbackRef.current) return;

    logger.debug('Starting polling fallback for messages');
    
    let lastMessageTime = new Date().toISOString();
    
    pollingFallbackRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .gt('created_at', lastMessageTime)
          .order('created_at');

        if (error) throw error;

        if (data && data.length > 0) {
          data.forEach(message => {
            onMessage?.({ new: message });
          });
          lastMessageTime = data[data.length - 1].created_at;
        }
      } catch (err) {
        logger.error('Polling fallback error:', err);
      }
    }, pollingInterval);
  }, [sessionId, onMessage]);

  const stopPollingFallback = useCallback(() => {
    if (pollingFallbackRef.current) {
      clearInterval(pollingFallbackRef.current);
      pollingFallbackRef.current = undefined;
      logger.debug('Stopped polling fallback');
    }
  }, []);

  const startHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) return;

    healthCheckIntervalRef.current = setInterval(() => {
      if (channelRef.current && connectionStatus.status === 'connected') {
        try {
          // Send a presence ping to test connection health
          channelRef.current.track({ ping: Date.now(), health_check: true });
        } catch (err) {
          logger.warn('Health check failed:', err);
          connect(); // Attempt to reconnect
        }
      }
    }, healthCheckInterval);
  }, [connectionStatus.status]);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) {
      setConnectionStatus(prev => ({ ...prev, status: 'disconnected' }));
      return;
    }

    cleanup(); // Clean up any existing connection

    logger.debug('Attempting to connect to realtime for session:', sessionId);
    
    setConnectionStatus(prev => ({
      ...prev,
      status: 'connecting',
      error: null
    }));

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      logger.warn('Connection timeout - switching to fallback');
      setConnectionStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Connection timeout',
        retryCount: prev.retryCount + 1
      }));
      
      // Start polling fallback immediately
      startPollingFallback();
      
      // Schedule retry if under max attempts
      if (connectionStatus.retryCount < maxRetries) {
        scheduleRetry();
      }
    }, connectionTimeout);

    // Create new channel
    const channel = supabase.channel(`robust-chat-${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: 'user' }
      }
    });

    // Set up message listener
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      logger.debug('Real-time message received:', payload);
      onMessage?.(payload);
    });

    // Set up session update listener
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions',
      filter: `id=eq.${sessionId}`
    }, (payload) => {
      logger.debug('Real-time session update received:', payload);
      onSessionUpdate?.(payload);
    });

    // Subscribe and handle status
    channel.subscribe((status) => {
      logger.debug('Channel status:', status);
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = undefined;
      }

      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus({
            status: 'connected',
            quality: 'excellent',
            lastConnected: new Date(),
            retryCount: 0,
            error: null
          });
          stopPollingFallback(); // Stop fallback when real-time works
          startHealthCheck();
          logger.info('Successfully connected to realtime');
          break;
          
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          logger.warn('Channel error:', status);
          setConnectionStatus(prev => ({
            ...prev,
            status: 'error',
            error: `Channel ${status.toLowerCase()}`,
            retryCount: prev.retryCount + 1
          }));
          startPollingFallback(); // Start fallback immediately
          if (connectionStatus.retryCount < maxRetries) {
            scheduleRetry();
          }
          break;
      }
    });

    channelRef.current = channel;
  }, [sessionId, enabled, onMessage, onSessionUpdate, connectionStatus.retryCount, maxRetries]);

  const scheduleRetry = useCallback(() => {
    const retryDelay = Math.min(1000 * Math.pow(2, connectionStatus.retryCount), 30000);
    logger.debug(`Scheduling retry in ${retryDelay}ms (attempt ${connectionStatus.retryCount + 1})`);
    
    retryTimeoutRef.current = setTimeout(() => {
      connect();
    }, retryDelay);
  }, [connectionStatus.retryCount, connect]);

  const forceReconnect = useCallback(() => {
    logger.debug('Force reconnect requested');
    setConnectionStatus(prev => ({
      ...prev,
      retryCount: 0,
      error: null
    }));
    connect();
  }, [connect]);

  // Initial connection
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [sessionId, enabled, connect, cleanup]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      logger.debug('Browser came online - reconnecting');
      forceReconnect();
    };

    const handleOffline = () => {
      logger.debug('Browser went offline');
      setConnectionStatus(prev => ({
        ...prev,
        status: 'disconnected',
        error: 'Browser offline'
      }));
      cleanup();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceReconnect, cleanup]);

  return {
    connectionStatus,
    forceReconnect,
    isConnected: connectionStatus.status === 'connected',
    isConnecting: connectionStatus.status === 'connecting',
    hasError: connectionStatus.status === 'error'
  };
};
