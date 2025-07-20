import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatOperations, MessageData, ChatOperationResult } from '@/hooks/useChatOperations';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { logger } from '@/utils/logger';

export interface OptimisticMessage {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string;
  message_type: string;
  metadata?: any;
  created_at: string;
  isOptimistic: true;
  status: 'sending' | 'failed' | 'timeout';
}

export interface RealMessage {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string;
  message_type: string;
  metadata?: any;
  created_at: string;
  is_read?: boolean;
  isOptimistic?: false;
}

export type ChatMessage = OptimisticMessage | RealMessage;

export interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  last_activity?: string;
  session_number?: number;
  end_reason?: string;
}

export interface UseRobustChatSessionResult {
  // Session state
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // Actions
  startSession: () => Promise<void>;
  sendMessage: (messageData: MessageData) => Promise<void>;
  endSession: (reason?: string) => Promise<void>;
  startFreshSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  retryFailedMessage: (messageId: string) => Promise<void>;
  
  // State checkers
  isSessionStale: boolean;
  hasFailedMessages: boolean;
}

const STALE_SESSION_THRESHOLD = 10 * 60 * 1000; // 10 minutes
const MESSAGE_TIMEOUT = 15000; // 15 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds for auto-refresh when disconnected

export const useRobustChatSession = (preassignedSpecialistId?: string): UseRobustChatSessionResult => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const chatOperations = useChatOperations();
  const { connectionStatus, createChannel, forceReconnect } = useConnectionMonitor();
  
  const channelRef = useRef<any>(null);
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);
  const lastRefreshRef = useRef<Date | null>(null);

  // Computed states
  const isSessionStale = session?.status === 'waiting' && 
    session.started_at && 
    (Date.now() - new Date(session.started_at).getTime()) > STALE_SESSION_THRESHOLD;

  const hasFailedMessages = messages.some(msg => 
    msg.isOptimistic && (msg.status === 'failed' || msg.status === 'timeout')
  );

  // Enhanced load session data with better error handling
  const loadSessionData = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Prevent excessive refresh calls
    if (!forceRefresh && lastRefreshRef.current && 
        Date.now() - lastRefreshRef.current.getTime() < 5000) {
      return;
    }

    lastRefreshRef.current = new Date();

    try {
      logger.debug('Loading session data', { forceRefresh });

      // Get user's most recent session
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (sessionData) {
        setSession(sessionData as ChatSession);
        
        // Load messages for this session
        const sessionMessages = await chatOperations.getSessionWithMessages(sessionData.id);
        if (sessionMessages && !sessionMessages.error) {
          logger.debug('Loaded messages', { count: sessionMessages.messages?.length || 0 });
          setMessages(sessionMessages.messages || []);
        }
      }

      setError(null);
    } catch (err) {
      logger.error('Failed to load session data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    }
  }, [user, chatOperations]);

  // Auto-refresh when disconnected
  useEffect(() => {
    if (connectionStatus.status === 'disconnected' && session && !refreshTimeoutRef.current) {
      refreshTimeoutRef.current = setTimeout(() => {
        logger.debug('Auto-refreshing due to disconnection');
        loadSessionData(true);
        refreshTimeoutRef.current = undefined;
      }, REFRESH_INTERVAL);
    }

    if (connectionStatus.status === 'connected' && refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = undefined;
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = undefined;
      }
    };
  }, [connectionStatus.status, session, loadSessionData]);

  // Enhanced real-time subscription setup
  const setupRealtimeSubscription = useCallback(() => {
    if (!session || channelRef.current) return;

    logger.debug('Setting up enhanced realtime subscription for session:', session.id);

    const channelName = `robust-chat-${session.id}-${Date.now()}`;
    const channel = createChannel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          logger.debug('New message received via realtime:', payload);
          const newMessage = payload.new as RealMessage;
          
          setMessages(prev => {
            // Remove matching optimistic message
            const withoutOptimistic = prev.filter(msg => 
              !(msg.isOptimistic && 
                msg.content === newMessage.content && 
                msg.sender_type === newMessage.sender_type &&
                Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 30000)
            );
            
            // Avoid duplicates
            if (withoutOptimistic.find(msg => msg.id === newMessage.id)) {
              return withoutOptimistic;
            }
            
            // Add new message and sort
            const updated = [...withoutOptimistic, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            return updated;
          });

          // Clear timeout for successful message
          messageTimeoutsRef.current.forEach((timeout, messageId) => {
            clearTimeout(timeout);
            messageTimeoutsRef.current.delete(messageId);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          logger.debug('Session updated via realtime:', payload);
          const updatedSession = payload.new as ChatSession;
          setSession(updatedSession);
        }
      );

    channelRef.current = channel;
  }, [session, createChannel]);

  // Cleanup realtime subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Clear all message timeouts
    messageTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    messageTimeoutsRef.current.clear();

    // Clear refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = undefined;
    }
  }, []);

  // Start a new session
  const startSession = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const result = await chatOperations.startSession();
      
      if (result.success && result.data) {
        setSession(result.data as ChatSession);
        setMessages([]);
      }
    } catch (err) {
      logger.error('Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  }, [user, chatOperations]);

  // Send a message with optimistic updates
  const sendMessage = useCallback(async (messageData: MessageData) => {
    if (!session || !user) {
      setError('No active session or user not authenticated');
      return;
    }

    // Check for duplicates
    const isDuplicate = await chatOperations.checkDuplicate(session.id, messageData.content);
    if (isDuplicate) {
      logger.warn('Duplicate message detected, skipping');
      return;
    }

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: `optimistic-${Date.now()}-${Math.random()}`,
      content: messageData.content,
      sender_type: messageData.sender_type || 'user',
      sender_id: user.id,
      message_type: messageData.message_type || 'text',
      metadata: messageData.metadata,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      status: 'sending'
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Set timeout for message
    const timeoutId = setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id && msg.isOptimistic
          ? { ...msg, status: 'timeout' as const }
          : msg
      ));
    }, MESSAGE_TIMEOUT);

    messageTimeoutsRef.current.set(optimisticMessage.id, timeoutId);

    try {
      const result = await chatOperations.sendMessage(session.id, messageData);
      
      if (!result.success) {
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id && msg.isOptimistic
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      }
    } catch (err) {
      logger.error('Failed to send message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id && msg.isOptimistic
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [session, user, chatOperations]);

  // End current session
  const endSession = useCallback(async (reason?: string) => {
    if (!session || !user) return;

    try {
      const result = await chatOperations.endSession(session.id, reason);
      if (result.success && result.data) {
        setSession(result.data as ChatSession);
      }
    } catch (err) {
      logger.error('Failed to end session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  }, [session, user, chatOperations]);

  // Start a fresh session (end current and start new)
  const startFreshSession = useCallback(async () => {
    if (session && session.status !== 'ended') {
      await endSession('start_fresh');
    }
    
    // Wait a moment for the end to process
    setTimeout(() => {
      startSession();
    }, 500);
  }, [session, endSession, startSession]);

  // Enhanced refresh session with connection retry
  const refreshSession = useCallback(async () => {
    logger.debug('Manual session refresh requested');
    
    // Test connection first
    const isConnected = await useConnectionMonitor().testConnection();
    if (!isConnected) {
      logger.debug('Connection test failed, forcing reconnect');
      forceReconnect();
    }
    
    await loadSessionData(true);
  }, [loadSessionData, forceReconnect]);

  // Retry a failed message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.isOptimistic);
    if (!failedMessage) return;

    // Update status to sending
    setMessages(prev => prev.map(msg => 
      msg.id === messageId && msg.isOptimistic
        ? { ...msg, status: 'sending' as const }
        : msg
    ));

    try {
      const messageData: MessageData = {
        content: failedMessage.content,
        sender_type: failedMessage.sender_type as any,
        message_type: failedMessage.message_type,
        metadata: failedMessage.metadata
      };

      await sendMessage(messageData);
      
      // Remove the failed message since sendMessage will create a new optimistic one
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
    } catch (err) {
      logger.error('Failed to retry message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId && msg.isOptimistic
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [messages, sendMessage]);

  // Initialize session on mount
  useEffect(() => {
    if (!isInitializedRef.current && user) {
      isInitializedRef.current = true;
      loadSessionData();
    }
  }, [user, loadSessionData]);

  // Setup realtime when session is available and connected
  useEffect(() => {
    if (session && session.status !== 'ended' && connectionStatus.status === 'connected') {
      setupRealtimeSubscription();
    } else if (connectionStatus.status === 'disconnected') {
      cleanupRealtimeSubscription();
    }

    return cleanupRealtimeSubscription;
  }, [session, connectionStatus.status, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [cleanupRealtimeSubscription]);

  return {
    session,
    messages,
    loading: chatOperations.loading,
    error: error || chatOperations.error,
    connectionStatus: connectionStatus.status,
    startSession,
    sendMessage,
    endSession,
    startFreshSession,
    refreshSession,
    retryFailedMessage,
    isSessionStale,
    hasFailedMessages
  };
};
