
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatOperations, MessageData, ChatOperationResult } from '@/hooks/useChatOperations';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { logger } from '@/utils/logger';
import { realtimeService, RealtimeEventHandler } from '@/services/realtimeService';

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
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  realtimeConnected: boolean;
  
  startSession: () => Promise<void>;
  sendMessage: (messageData: MessageData) => Promise<void>;
  endSession: (reason?: string) => Promise<void>;
  startFreshSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  retryFailedMessage: (messageId: string) => Promise<void>;
  
  isSessionStale: boolean;
  hasFailedMessages: boolean;
}

const STALE_SESSION_THRESHOLD = 10 * 60 * 1000; // 10 minutes
const MESSAGE_TIMEOUT = 10000; // 10 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

export const useRobustChatSession = (preassignedSpecialistId?: string): UseRobustChatSessionResult => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  
  const { user } = useAuth();
  const chatOperations = useChatOperations();
  const { connectionStatus, createChannel, forceReconnect, testConnection } = useConnectionMonitor();
  
  const subscriptionRefs = useRef<string[]>([]);
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

  // Load session data
  const loadSessionData = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    if (!forceRefresh && lastRefreshRef.current && 
        Date.now() - lastRefreshRef.current.getTime() < 5000) {
      return;
    }

    lastRefreshRef.current = new Date();

    try {
      logger.debug('🔄 Loading session data', { forceRefresh });

      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (sessionData) {
        const newSession = sessionData as ChatSession;
        setSession(newSession);
        
        // Load messages for this session
        const sessionMessages = await chatOperations.getSessionWithMessages(newSession.id);
        if (sessionMessages && !sessionMessages.error) {
          logger.debug('📨 Loaded messages', { count: sessionMessages.messages?.length || 0 });
          setMessages(sessionMessages.messages || []);
        }
      }

      setError(null);
    } catch (err) {
      logger.error('❌ Failed to load session data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    }
  }, [user, chatOperations]);

  // Set up realtime subscription for this session using centralized service
  const setupRealtimeSubscription = useCallback((sessionId: string) => {
    if (subscriptionRefs.current.length > 0) {
      logger.debug('🧹 Cleaning up existing subscriptions before creating new ones');
      cleanupRealtimeSubscription();
    }

    logger.debug('📡 Setting up realtime subscription for session:', sessionId);
    const channelName = `chat-session-${sessionId}`;

    // Handler for new messages
    const handleNewMessage: RealtimeEventHandler = (payload) => {
      logger.debug('📨 New message via realtime:', payload.new);
      const newMessage = payload.new as RealMessage;
      
      setMessages(prev => {
        // Remove any matching optimistic message
        const withoutOptimistic = prev.filter(msg => {
          if (!msg.isOptimistic) return true;
          
          // Simple matching based on content and timing
          const isMatch = msg.content === newMessage.content && 
                        msg.sender_type === newMessage.sender_type &&
                        Math.abs(new Date(newMessage.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000;
          
          if (isMatch) {
            logger.debug('✅ Matched optimistic message:', { optimisticId: msg.id, realId: newMessage.id });
            // Clear timeout
            const timeout = messageTimeoutsRef.current.get(msg.id);
            if (timeout) {
              clearTimeout(timeout);
              messageTimeoutsRef.current.delete(msg.id);
            }
          }
          
          return !isMatch;
        });
        
        // Check if real message already exists
        if (withoutOptimistic.find(msg => msg.id === newMessage.id)) {
          logger.debug('⚠️ Duplicate real message, skipping');
          return prev;
        }
        
        // Add new message and sort by timestamp
        const updated = [...withoutOptimistic, newMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        logger.debug('📨 Messages updated via realtime:', { 
          before: prev.length, 
          after: updated.length,
          newMessageId: newMessage.id
        });
        return updated;
      });
    };

    // Handler for session updates
    const handleSessionUpdate: RealtimeEventHandler = (payload) => {
      logger.debug('📋 Session updated via realtime:', payload.new);
      const updatedSession = payload.new as ChatSession;
      setSession(updatedSession);
    };

    // Subscribe to message inserts
    const messageSubscriptionId = realtimeService.subscribe(
      channelName,
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
      channelName,
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${sessionId}`
      },
      handleSessionUpdate
    );

    subscriptionRefs.current = [messageSubscriptionId, sessionSubscriptionId];

    // Monitor connection status
    const checkConnection = () => {
      const status = realtimeService.getConnectionStatus();
      setRealtimeConnected(status.isConnected);
    };
    
    // Check connection status periodically
    const statusInterval = setInterval(checkConnection, 1000);
    checkConnection();
    
    // Store interval reference for cleanup
    (subscriptionRefs.current as any).statusInterval = statusInterval;
  }, []);

  // Cleanup subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (subscriptionRefs.current.length > 0) {
      logger.debug('🧹 Cleaning up realtime subscription');
      subscriptionRefs.current.forEach(subscriptionId => {
        realtimeService.unsubscribe(subscriptionId, () => {});
      });
      
      // Clear status interval if it exists
      const statusInterval = (subscriptionRefs.current as any).statusInterval;
      if (statusInterval) {
        clearInterval(statusInterval);
      }
      
      subscriptionRefs.current = [];
      setRealtimeConnected(false);
    }
    
    messageTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    messageTimeoutsRef.current.clear();

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = undefined;
    }
  }, []);

  // Start session
  const startSession = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      logger.debug('🚀 Starting new session');
      
      const result = await chatOperations.startSession();
      
      if (result.success && result.data) {
        const newSession = result.data as ChatSession;
        setSession(newSession);
        setMessages([]);
        // Set up real-time subscription immediately
        setupRealtimeSubscription(newSession.id);
        logger.debug('✅ Session started and subscription set up:', newSession.id);
      }
    } catch (err) {
      logger.error('❌ Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  }, [user, chatOperations, setupRealtimeSubscription]);

  // Send message - simplified and more reliable
  const sendMessage = useCallback(async (messageData: MessageData) => {
    if (!session || !user) {
      setError('No active session or user not authenticated');
      return;
    }

    // Check for duplicate
    const isDuplicate = await chatOperations.checkDuplicate(session.id, messageData.content);
    if (isDuplicate) {
      logger.warn('⚠️ Duplicate message detected, skipping');
      return;
    }

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    logger.debug('📤 Sending message with optimistic update:', { 
      id: optimisticMessage.id, 
      content: optimisticMessage.content.substring(0, 50) 
    });

    // Set timeout for message
    const timeoutId = setTimeout(() => {
      logger.debug('⏰ Message timeout:', optimisticMessage.id);
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
        logger.error('❌ Message send failed:', result.error_message);
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id && msg.isOptimistic
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      } else {
        logger.debug('✅ Message sent successfully, real-time will handle confirmation');
        // Real-time subscription will handle replacing optimistic message
      }
    } catch (err) {
      logger.error('❌ Failed to send message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id && msg.isOptimistic
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [session, user, chatOperations]);

  // End session
  const endSession = useCallback(async (reason?: string) => {
    if (!session || !user) return;

    try {
      logger.debug('🛑 Ending session:', session.id);
      const result = await chatOperations.endSession(session.id, reason);
      if (result.success && result.data) {
        setSession(result.data as ChatSession);
      }
    } catch (err) {
      logger.error('❌ Failed to end session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  }, [session, user, chatOperations]);

  // Start fresh session
  const startFreshSession = useCallback(async () => {
    if (session && session.status !== 'ended') {
      await endSession('start_fresh');
    }
    
    setTimeout(() => {
      startSession();
    }, 500);
  }, [session, endSession, startSession]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    logger.debug('🔄 Manual session refresh');
    
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.debug('🔌 Connection test failed, forcing reconnect');
      forceReconnect();
    }
    
    await loadSessionData(true);
  }, [testConnection, forceReconnect, loadSessionData]);

  // Retry failed message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.isOptimistic);
    if (!failedMessage) return;

    logger.debug('🔄 Retrying failed message:', messageId);

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

      // Remove the failed message
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      await sendMessage(messageData);
      
    } catch (err) {
      logger.error('❌ Failed to retry message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId && msg.isOptimistic
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [messages, sendMessage]);

  // Setup realtime subscription when session changes
  useEffect(() => {
    if (session && session.status !== 'ended') {
      logger.debug('📡 Session available, setting up realtime subscription');
      setupRealtimeSubscription(session.id);
    } else {
      cleanupRealtimeSubscription();
    }

    return cleanupRealtimeSubscription;
  }, [session?.id, session?.status, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Auto-refresh when disconnected
  useEffect(() => {
    if (connectionStatus.status === 'disconnected' && session && !refreshTimeoutRef.current) {
      refreshTimeoutRef.current = setTimeout(() => {
        logger.debug('🔄 Auto-refreshing due to disconnection');
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

  // Initialize session on mount
  useEffect(() => {
    if (!isInitializedRef.current && user) {
      isInitializedRef.current = true;
      logger.debug('🔧 Initializing session on mount');
      loadSessionData();
    }
  }, [user, loadSessionData]);

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
    realtimeConnected,
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
