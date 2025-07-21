
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected';
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
}

export const useConnectionMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null,
    quality: 'unknown'
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;
  const testChannelRef = useRef<any>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const connectionStartTime = useRef<number>(0);

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  };

  const updateConnectionStatus = useCallback((updates: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Enhanced connection test with quality metrics
  const testConnection = useCallback(async () => {
    try {
      connectionStartTime.current = Date.now();
      
      // Test basic database connectivity
      const { error } = await supabase.from('chat_sessions').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      const responseTime = Date.now() - connectionStartTime.current;
      
      // Determine connection quality based on response time
      let quality: ConnectionStatus['quality'] = 'excellent';
      if (responseTime > 2000) quality = 'poor';
      else if (responseTime > 1000) quality = 'good';

      updateConnectionStatus({
        status: 'connected',
        lastConnected: new Date(),
        reconnectAttempts: 0,
        error: null,
        quality
      });
      
      return true;
    } catch (error) {
      logger.error('Connection test failed', error);
      updateConnectionStatus({
        status: 'disconnected',
        error: 'Connection test failed',
        quality: 'poor'
      });
      return false;
    }
  }, [updateConnectionStatus]);

  // Enhanced reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    setConnectionStatus(current => {
      if (current.reconnectAttempts >= maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached');
        return {
          ...current,
          status: 'disconnected',
          error: 'Max reconnection attempts reached'
        };
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 1000;
      const delay = Math.min(
        baseReconnectDelay * Math.pow(2, current.reconnectAttempts) + jitter,
        30000
      );

      logger.debug(`Scheduling reconnection in ${delay}ms`, {
        attempt: current.reconnectAttempts + 1,
        maxAttempts: maxReconnectAttempts
      });

      clearReconnectTimeout();
      reconnectTimeoutRef.current = setTimeout(async () => {
        setConnectionStatus(prev => ({
          ...prev,
          status: 'connecting',
          reconnectAttempts: prev.reconnectAttempts + 1,
          error: null
        }));
        
        await testConnection();
      }, delay);

      return current;
    });
  }, [testConnection]);

  const forceReconnect = useCallback(async () => {
    logger.debug('Force reconnecting');
    clearReconnectTimeout();
    updateConnectionStatus({
      status: 'connecting',
      reconnectAttempts: 0,
      error: null
    });
    
    await testConnection();
  }, [updateConnectionStatus, testConnection]);

  // Create a reliable channel with enhanced error handling
  const createChannel = useCallback((channelName: string, config?: any) => {
    logger.debug('Creating channel', { channelName, config });
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'user' },
        ...config
      }
    });

    // Enhanced subscription monitoring
    const originalSubscribe = channel.subscribe.bind(channel);
    channel.subscribe = (callback) => {
      return originalSubscribe((status, error) => {
        logger.debug('Channel subscription status', { channelName, status, error });
        
        if (status === 'SUBSCRIBED') {
          updateConnectionStatus({
            status: 'connected',
            lastConnected: new Date(),
            error: null
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          updateConnectionStatus({
            status: 'disconnected',
            error: `Channel error: ${status}`
          });
          
          // Auto-retry on channel errors
          setTimeout(() => {
            scheduleReconnect();
          }, 2000);
        }
        
        if (callback) callback(status, error);
      });
    };

    return channel;
  }, [updateConnectionStatus, scheduleReconnect]);

  // WebSocket-specific health check
  const performHealthCheck = useCallback(async () => {
    if (testChannelRef.current) {
      try {
        // Send a presence ping to test real-time connectivity
        await testChannelRef.current.track({ 
          ping: Date.now(),
          health_check: true 
        });
      } catch (error) {
        logger.warn('Health check failed', error);
        if (connectionStatus.status === 'connected') {
          scheduleReconnect();
        }
      }
    }
  }, [connectionStatus.status, scheduleReconnect]);

  // Initial connection test and health monitoring
  useEffect(() => {
    testConnection();

    // Create a test channel for health checks
    testChannelRef.current = supabase.channel('connection-health', {
      config: { presence: { key: 'health' } }
    });

    testChannelRef.current.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        // Start periodic health checks
        healthCheckIntervalRef.current = setInterval(performHealthCheck, 30000);
      }
    });

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (testChannelRef.current) {
        supabase.removeChannel(testChannelRef.current);
      }
    };
  }, [testConnection, performHealthCheck]);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      logger.debug('Browser came online');
      forceReconnect();
    };

    const handleOffline = () => {
      logger.debug('Browser went offline');
      updateConnectionStatus({
        status: 'disconnected',
        error: 'Browser offline'
      });
      clearReconnectTimeout();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceReconnect, updateConnectionStatus]);

  // Auto-reconnect logic
  useEffect(() => {
    if (connectionStatus.status === 'disconnected' && 
        connectionStatus.reconnectAttempts < maxReconnectAttempts) {
      scheduleReconnect();
    }

    return () => {
      clearReconnectTimeout();
    };
  }, [connectionStatus.status, connectionStatus.reconnectAttempts, scheduleReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (testChannelRef.current) {
        supabase.removeChannel(testChannelRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    createChannel,
    testConnection,
    forceReconnect
  };
};
