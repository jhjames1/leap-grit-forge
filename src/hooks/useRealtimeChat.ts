
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '@/services/realtimeService';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { logger } from '@/utils/logger';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'specialist' | 'system';
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
  const { user } = useAuth();
  
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
  const handleNewMessage = useCallback(async (payload: any) => {
    logger.debug('🔴 PEER CLIENT: New message received via realtime:', payload.new);
    const newMessage = payload.new as ChatMessage;
    
    if (newMessage.session_id === sessionId) {
      setLastMessageAt(new Date());
      logger.debug('🔴 PEER CLIENT: Calling message handler for session:', sessionId);
      messageHandler.current?.(newMessage);
      
      // Send notification if the message is from a different user (not from current user)
      if (user && newMessage.sender_id !== user.id && newMessage.sender_type !== 'system') {
        const senderType = newMessage.sender_type === 'specialist' ? 'Specialist' : 'User';
        
        // Don't send notifications to yourself
        notificationService.sendNotification({
          title: `New Message from ${senderType}`,
          body: newMessage.content.length > 50 
            ? newMessage.content.substring(0, 50) + '...' 
            : newMessage.content,
          data: { 
            type: 'chat_message', 
            sessionId: newMessage.session_id,
            messageId: newMessage.id,
            senderType: newMessage.sender_type
          }
        }).catch(error => console.error('Failed to send chat notification:', error));
      }
    } else {
      logger.debug('🔴 PEER CLIENT: Message for different session, ignoring:', newMessage.session_id);
    }
  }, [sessionId, user]);

  // Session event handler
  const handleSessionUpdate = useCallback((payload: any) => {
    logger.debug('🔴 PEER CLIENT: Session updated via realtime:', payload.new);
    const updatedSession = payload.new as ChatSession;
    
    if (updatedSession.id === sessionId) {
      logger.debug('🔴 PEER CLIENT: Calling session handler for session:', sessionId);
      sessionHandler.current?.(updatedSession);
    } else {
      logger.debug('🔴 PEER CLIENT: Session update for different session, ignoring:', updatedSession.id);
    }
  }, [sessionId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId) {
      // Clean up existing subscriptions - use proper cleanup
      subscriptionIds.current.forEach(id => {
        realtimeService.unsubscribe(id, () => {}); // Clean function for proper removal
      });
      subscriptionIds.current = [];
      setIsConnected(false);
      return;
    }

    logger.debug('🔴 PEER CLIENT: Setting up realtime subscriptions for session:', sessionId);

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
      // Clean up subscriptions properly using handlers
      realtimeService.unsubscribe(messageSubscriptionId, handleNewMessage);
      realtimeService.unsubscribe(sessionSubscriptionId, handleSessionUpdate);
      subscriptionIds.current = [];
    };
  }, [sessionId, handleNewMessage, handleSessionUpdate, connectionStatus.status]);

  // Force reconnect function
  const forceReconnect = useCallback(() => {
    logger.debug('🔄 PEER CLIENT: Force reconnecting realtime subscriptions from useRealtimeChat');
    console.log('🔄 PEER CLIENT: Force reconnect button clicked');
    
    // First clean up existing subscriptions
    subscriptionIds.current.forEach(id => {
      try {
        const subscription = (realtimeService as any).subscriptions.get(id);
        if (subscription) {
          realtimeService.unsubscribe(id, handleNewMessage);
          realtimeService.unsubscribe(id, handleSessionUpdate);
        }
      } catch (error) {
        logger.warn('Error cleaning up subscription during reconnect', error);
      }
    });
    subscriptionIds.current = [];
    
    // Force reconnect the entire realtime service
    realtimeService.reconnectAll();
    
    // Re-establish subscriptions for current session if we have one
    if (sessionId) {
      setTimeout(() => {
        logger.debug('🔄 PEER CLIENT: Re-establishing subscriptions after reconnect');
        
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
        logger.debug('🔄 PEER CLIENT: Subscriptions re-established after reconnect');
      }, 1000);
    }
  }, [sessionId, handleNewMessage, handleSessionUpdate]);

  return {
    isConnected,
    lastMessageAt,
    connectionQuality: connectionStatus.quality,
    forceReconnect
  };
};
