
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'specialist';
  message_type: 'text' | 'quick_action' | 'system';
  content: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
  session_id: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  last_activity?: string;
  end_reason?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
}

interface UseSimpleRealtimeChatProps {
  sessionId: string | null;
  onMessage?: (message: ChatMessage) => void;
  onSessionUpdate?: (session: ChatSession) => void;
  enabled?: boolean;
}

export const useSimpleRealtimeChat = ({
  sessionId,
  onMessage,
  onSessionUpdate,
  enabled = true
}: UseSimpleRealtimeChatProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: 'disconnected'
  });

  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      logger.debug('🧹 Cleaning up realtime channel');
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
    
    setConnectionStatus({
      isConnected: false,
      status: 'disconnected'
    });
  }, []);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) {
      cleanup();
      return;
    }

    logger.debug('📡 Connecting to realtime for session:', sessionId);
    
    // Clean up existing connection
    cleanup();
    
    setConnectionStatus({
      isConnected: false,
      status: 'connecting'
    });

    // Set a connection timeout (shorter timeout for faster feedback)
    connectionTimeoutRef.current = setTimeout(() => {
      logger.warn('⚠️ Connection timeout after 5 seconds');
      setConnectionStatus({
        isConnected: false,
        status: 'error',
        error: 'Connection timeout'
      });
    }, 5000);

    // Create channel with simplified config
    const channel = supabase.channel(`chat-${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: 'user' }
      }
    });

    // Listen for messages
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      logger.debug('📨 Real-time message received:', payload.new);
      onMessage?.(payload.new as ChatMessage);
    });

    // Listen for session updates
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions',
      filter: `id=eq.${sessionId}`
    }, (payload) => {
      logger.debug('📋 Real-time session update:', payload.new);
      onSessionUpdate?.(payload.new as ChatSession);
    });

    // Subscribe and handle status changes
    channel.subscribe((status) => {
      logger.debug('🔗 Channel status:', status);
      
      // Clear connection timeout on any status change
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = undefined;
      }

      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus({
            isConnected: true,
            status: 'connected'
          });
          logger.info('✅ Successfully connected to realtime');
          break;
          
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          logger.warn('❌ Channel error:', status);
          setConnectionStatus({
            isConnected: false,
            status: 'error',
            error: `Channel ${status.toLowerCase()}`
          });
          
          // Auto-retry after 2 seconds
          retryTimeoutRef.current = setTimeout(() => {
            logger.debug('🔄 Auto-retrying connection');
            connect();
          }, 2000);
          break;
      }
    });

    channelRef.current = channel;
  }, [sessionId, enabled, onMessage, onSessionUpdate, cleanup]);

  const forceReconnect = useCallback(() => {
    logger.debug('🔄 Force reconnecting');
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
      logger.debug('🌐 Browser came online');
      connect();
    };

    const handleOffline = () => {
      logger.debug('📴 Browser went offline');
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
