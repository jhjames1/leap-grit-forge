
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
    status: 'connecting',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;
  const testChannelRef = useRef<any>(null);

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

  const testConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('chat_sessions').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      updateConnectionStatus({
        status: 'connected',
        lastConnected: new Date(),
        reconnectAttempts: 0,
        error: null
      });
      
      return true;
    } catch (error) {
      logger.error('Connection test failed', error);
      updateConnectionStatus({
        status: 'disconnected',
        error: 'Connection test failed'
      });
      return false;
    }
  }, [updateConnectionStatus]);

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
      reconnectTimeoutRef.current = setTimeout(async () => {
        setConnectionStatus(prev => ({
          ...prev,
          status: 'connecting',
          reconnectAttempts: prev.reconnectAttempts + 1,
          error: null
        }));
        
        // Test the connection
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
    
    // Immediately test connection
    await testConnection();
  }, [updateConnectionStatus, testConnection]);

  // Create a simple channel without subscription monitoring (let components handle their own)
  const createChannel = useCallback((channelName: string) => {
    logger.debug('Creating channel', { channelName });
    return supabase.channel(channelName);
  }, []);

  // Initial connection test and periodic health checks
  useEffect(() => {
    // Initial connection test
    testConnection();

    // Set up periodic health checks every 30 seconds
    const healthCheckInterval = setInterval(async () => {
      if (connectionStatus.status === 'connected') {
        const isHealthy = await testConnection();
        if (!isHealthy) {
          scheduleReconnect();
        }
      } else if (connectionStatus.status === 'disconnected' && connectionStatus.reconnectAttempts < maxReconnectAttempts) {
        scheduleReconnect();
      }
    }, 30000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [testConnection, scheduleReconnect, connectionStatus.status, connectionStatus.reconnectAttempts]);

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
