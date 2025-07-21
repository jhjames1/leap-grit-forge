
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '@/services/realtimeService';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
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
}

interface UseRealtimeChatOptions {
  sessionId: string | null;
  onMessage?: (message: ChatMessage) => void;
  onSessionUpdate?: (session: ChatSession) => void;
}

export const useRealtimeChat = ({ sessionId, onMessage, onSessionUpdate }: UseRealtimeChatOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);
  const { connectionStatus } = useConnectionMonitor();
  
  const subscriptionIds = useRef<string[]>([]);
  const messageHandler = useRef(onMessage);
  const sessionHandler = useRef(onSessionUpdate);

  // Update refs when handlers change
  useEffect(() => {
    messageHandler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    sessionHandler.current = onSessionUpdate;
  }, [onSessionUpdate]);

  // Message event handler
  const handleNewMessage = useCallback((payload: any) => {
    logger.debug('🔴 New message received via realtime:', payload.new);
    const newMessage = payload.new as ChatMessage;
    
    if (newMessage.session_id === sessionId) {
      setLastMessageAt(new Date());
      messageHandler.current?.(newMessage);
    }
  }, [sessionId]);

  // Session event handler
  const handleSessionUpdate = useCallback((payload: any) => {
    logger.debug('🔴 Session updated via realtime:', payload.new);
    const updatedSession = payload.new as ChatSession;
    
    if (updatedSession.id === sessionId) {
      sessionHandler.current?.(updatedSession);
    }
  }, [sessionId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId) {
      // Clean up existing subscriptions
      subscriptionIds.current.forEach(id => {
        realtimeService.unsubscribe(id, handleNewMessage);
        realtimeService.unsubscribe(id, handleSessionUpdate);
      });
      subscriptionIds.current = [];
      setIsConnected(false);
      return;
    }

    logger.debug('🔴 Setting up realtime subscriptions for session:', sessionId);

    // Subscribe to messages
    const messageSubscriptionId = realtimeService.subscribe(
      `chat-messages-${sessionId}`,
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      handleNewMessage
    );

    // Subscribe to session updates
    const sessionSubscriptionId = realtimeService.subscribe(
      `chat-session-${sessionId}`,
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${sessionId}`
      },
      handleSessionUpdate
    );

    subscriptionIds.current = [messageSubscriptionId, sessionSubscriptionId];

    // Monitor connection status
    const checkConnection = () => {
      const { isConnected: serviceConnected } = realtimeService.getConnectionStatus();
      setIsConnected(serviceConnected && connectionStatus.status === 'connected');
    };

    checkConnection();
    const intervalId = setInterval(checkConnection, 5000);

    return () => {
      clearInterval(intervalId);
      subscriptionIds.current.forEach(id => {
        realtimeService.unsubscribe(id, handleNewMessage);
        realtimeService.unsubscribe(id, handleSessionUpdate);
      });
      subscriptionIds.current = [];
    };
  }, [sessionId, handleNewMessage, handleSessionUpdate, connectionStatus.status]);

  // Force reconnect function
  const forceReconnect = useCallback(() => {
    logger.debug('🔄 Force reconnecting realtime subscriptions');
    realtimeService.reconnectAll();
  }, []);

  return {
    isConnected,
    lastMessageAt,
    connectionQuality: connectionStatus.quality,
    forceReconnect
  };
};
