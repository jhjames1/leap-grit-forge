/**
 * Core realtime subscription hook for chat
 * Provides real-time message and session updates via Supabase channels
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ChatMessage, ChatSession, ConnectionStatus } from '@/types/chat';

interface UseChatRealtimeProps {
  sessionId: string | null;
  onMessage?: (message: ChatMessage) => void;
  onSessionUpdate?: (session: ChatSession) => void;
  enabled?: boolean;
}

export const useChatRealtime = ({
  sessionId,
  onMessage,
  onSessionUpdate,
  enabled = true
}: UseChatRealtimeProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: 'disconnected'
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      logger.debug('🧹 Chat realtime: Cleaning up channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = undefined;
    }
  }, []);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) {
      cleanup();
      setConnectionStatus({ isConnected: false, status: 'disconnected' });
      return;
    }

    logger.debug('📡 Chat realtime: Connecting for session:', sessionId);
    
    // Clean up existing connection
    cleanup();
    
    setConnectionStatus({ isConnected: false, status: 'connecting' });

    // Set a connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      logger.warn('⚠️ Chat realtime: Connection timeout');
      setConnectionStatus({
        isConnected: false,
        status: 'error',
        error: 'Connection timeout'
      });
      
      // Auto-retry if under max retries
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        retryTimeoutRef.current = setTimeout(connect, 2000 * retryCountRef.current);
      }
    }, 5000);

    // Create channel with unique name including timestamp to prevent stale connections
    const channelName = `chat-${sessionId}-${Date.now()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'user' }
      }
    });

    // Listen for new messages
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      logger.debug('📨 Chat realtime: New message:', payload.new);
      onMessage?.(payload.new as ChatMessage);
    });

    // Listen for session updates
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions',
      filter: `id=eq.${sessionId}`
    }, (payload) => {
      logger.debug('📋 Chat realtime: Session update:', payload.new);
      onSessionUpdate?.(payload.new as ChatSession);
    });

    // Subscribe and handle status
    channel.subscribe((status) => {
      logger.debug('🔗 Chat realtime: Channel status:', status);
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = undefined;
      }

      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus({ isConnected: true, status: 'connected' });
          retryCountRef.current = 0; // Reset retry count on success
          logger.info('✅ Chat realtime: Connected');
          break;
          
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          logger.warn('❌ Chat realtime: Channel error:', status);
          setConnectionStatus({
            isConnected: false,
            status: 'error',
            error: `Channel ${status.toLowerCase()}`
          });
          
          // Auto-retry with exponential backoff
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 30000);
            retryTimeoutRef.current = setTimeout(connect, delay);
          }
          break;
      }
    });

    channelRef.current = channel;
  }, [sessionId, enabled, onMessage, onSessionUpdate, cleanup]);

  const forceReconnect = useCallback(() => {
    logger.debug('🔄 Chat realtime: Force reconnecting');
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  // Connect when sessionId or enabled changes
  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      logger.debug('🌐 Chat realtime: Browser online');
      retryCountRef.current = 0;
      connect();
    };

    const handleOffline = () => {
      logger.debug('📴 Chat realtime: Browser offline');
      setConnectionStatus({
        isConnected: false,
        status: 'disconnected',
        error: 'Browser offline'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect]);

  return {
    connectionStatus,
    forceReconnect,
    isConnected: connectionStatus.isConnected
  };
};
