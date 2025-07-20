
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected';
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

export const useConnectionMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

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

      const delay = Math.min(
        baseReconnectDelay * Math.pow(2, current.reconnectAttempts),
        30000
      );

      logger.debug(`Scheduling reconnection in ${delay}ms`, {
        attempt: current.reconnectAttempts + 1,
        maxAttempts: maxReconnectAttempts
      });

      clearReconnectTimeout();
      reconnectTimeoutRef.current = setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          status: 'connecting',
          reconnectAttempts: prev.reconnectAttempts + 1,
          error: null
        }));
      }, delay);

      return current;
    });
  }, []);

  const handleConnectionChange = useCallback((status: string) => {
    logger.debug('Connection status changed', { status });

    switch (status) {
      case 'SUBSCRIBED':
        updateConnectionStatus({
          status: 'connected',
          lastConnected: new Date(),
          reconnectAttempts: 0,
          error: null
        });
        clearReconnectTimeout();
        break;

      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
      case 'CLOSED':
        updateConnectionStatus({
          status: 'disconnected',
          error: `Connection failed: ${status}`
        });
        scheduleReconnect();
        break;

      case 'CONNECTING':
        updateConnectionStatus({
          status: 'connecting',
          error: null
        });
        break;

      default:
        logger.warn('Unknown connection status', { status });
    }
  }, [updateConnectionStatus, scheduleReconnect]);

  const createChannel = useCallback((channelName: string) => {
    logger.debug('Creating channel', { channelName });
    
    updateConnectionStatus({
      status: 'connecting',
      error: null
    });

    const channel = supabase.channel(channelName);
    
    // Monitor subscription status
    channel.subscribe(handleConnectionChange);

    return channel;
  }, [handleConnectionChange]);

  const testConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('chat_sessions').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Connection test failed', error);
      return false;
    }
  }, []);

  const forceReconnect = useCallback(() => {
    logger.debug('Force reconnecting');
    updateConnectionStatus({
      status: 'connecting',
      reconnectAttempts: 0,
      error: null
    });
    clearReconnectTimeout();
  }, [updateConnectionStatus]);

  // Monitor online/offline status
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, []);

  return {
    connectionStatus,
    createChannel,
    testConnection,
    forceReconnect
  };
};
