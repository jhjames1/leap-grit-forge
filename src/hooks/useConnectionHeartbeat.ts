import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface ConnectionState {
  isOnline: boolean;
  isSupabaseConnected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  autoReconnecting: boolean;
}

interface UseConnectionHeartbeatOptions {
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
  onConnectionChange?: (state: ConnectionState) => void;
}

export const useConnectionHeartbeat = ({
  heartbeatInterval = 30000, // 30 seconds
  maxReconnectAttempts = 10,
  onConnectionChange
}: UseConnectionHeartbeatOptions = {}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    isSupabaseConnected: true,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    autoReconnecting: false
  });

  const heartbeatTimerRef = useRef<NodeJS.Timeout>();
  const reconnectTimerRef = useRef<NodeJS.Timeout>();
  const isUnmountedRef = useRef(false);

  const updateConnectionState = useCallback((updates: Partial<ConnectionState>) => {
    if (isUnmountedRef.current) return;
    
    setConnectionState(prev => {
      const newState = { ...prev, ...updates };
      onConnectionChange?.(newState);
      return newState;
    });
  }, [onConnectionChange]);

  // Perform heartbeat check
  const performHeartbeat = useCallback(async () => {
    if (isUnmountedRef.current) return;

    try {
      console.log('🫀 HEARTBEAT: Performing connection check...');
      
      // Simple query to test Supabase connection
      const { error } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);

      if (error) {
        console.warn('🫀 HEARTBEAT: Supabase connection failed:', error);
        updateConnectionState({
          isSupabaseConnected: false,
          lastHeartbeat: new Date()
        });
        scheduleReconnect();
      } else {
        console.log('🫀 HEARTBEAT: Connection healthy');
        updateConnectionState({
          isSupabaseConnected: true,
          lastHeartbeat: new Date(),
          reconnectAttempts: 0,
          autoReconnecting: false
        });
      }
    } catch (error) {
      console.error('🫀 HEARTBEAT: Connection check failed:', error);
      updateConnectionState({
        isSupabaseConnected: false,
        lastHeartbeat: new Date()
      });
      scheduleReconnect();
    }
  }, [updateConnectionState]);

  // Schedule automatic reconnection
  const scheduleReconnect = useCallback(() => {
    if (isUnmountedRef.current) return;

    setConnectionState(prev => {
      if (prev.autoReconnecting || prev.reconnectAttempts >= maxReconnectAttempts) {
        return prev;
      }

      const newAttempts = prev.reconnectAttempts + 1;
      const delay = Math.min(1000 * Math.pow(2, newAttempts - 1), 30000); // Exponential backoff, max 30s

      console.log(`🔄 HEARTBEAT: Scheduling reconnect attempt ${newAttempts} in ${delay}ms`);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = setTimeout(() => {
        if (!isUnmountedRef.current) {
          console.log(`🔄 HEARTBEAT: Executing reconnect attempt ${newAttempts}`);
          performHeartbeat();
        }
      }, delay);

      return {
        ...prev,
        autoReconnecting: true,
        reconnectAttempts: newAttempts
      };
    });
  }, [maxReconnectAttempts, performHeartbeat]);

  // Manual force reconnect
  const forceReconnect = useCallback(async () => {
    console.log('🔄 HEARTBEAT: Manual reconnect triggered');
    
    // Clear any existing timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
    }

    updateConnectionState({
      reconnectAttempts: 0,
      autoReconnecting: true
    });

    // Perform immediate heartbeat check
    await performHeartbeat();

    // Restart heartbeat timer
    startHeartbeat();
  }, [performHeartbeat, updateConnectionState]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
    }

    console.log(`🫀 HEARTBEAT: Starting heartbeat monitoring (${heartbeatInterval}ms interval)`);
    
    // Immediate check
    performHeartbeat();

    // Schedule recurring checks
    heartbeatTimerRef.current = setInterval(() => {
      if (!isUnmountedRef.current) {
        performHeartbeat();
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, performHeartbeat]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 HEARTBEAT: Browser came online');
      updateConnectionState({ isOnline: true });
      forceReconnect();
    };

    const handleOffline = () => {
      console.log('🌐 HEARTBEAT: Browser went offline');
      updateConnectionState({ 
        isOnline: false, 
        isSupabaseConnected: false 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceReconnect, updateConnectionState]);

  // Start heartbeat on mount
  useEffect(() => {
    startHeartbeat();

    return () => {
      isUnmountedRef.current = true;
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [startHeartbeat]);

  return {
    connectionState,
    forceReconnect,
    isHealthy: connectionState.isOnline && connectionState.isSupabaseConnected
  };
};