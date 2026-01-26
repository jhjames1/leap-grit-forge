/**
 * User-side chat hook
 * Manages chat sessions and messages for end users
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { useChatRealtime } from './useChatRealtime';
import { useChatMessages } from './useChatMessages';
import type { ChatSession, UserChatHookResult, SendMessageParams } from '@/types/chat';

const SESSION_STALE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const useUserChat = (specialistId?: string): UserChatHookResult => {
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const {
    messages,
    loading: messagesLoading,
    error,
    loadMessages,
    addMessage,
    sendMessage: sendMessageBase,
    clearMessages,
    setError
  } = useChatMessages({
    sessionId: session?.id || null,
    userId: user?.id || null,
    senderType: 'user'
  });

  // Handle real-time updates
  const handleNewMessage = useCallback((message: any) => {
    logger.debug('📨 User chat: New message received');
    addMessage(message);
  }, [addMessage]);

  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    logger.debug('📋 User chat: Session updated:', updatedSession.status);
    setSession(updatedSession);
  }, []);

  const { connectionStatus, forceReconnect, isConnected } = useChatRealtime({
    sessionId: session?.id || null,
    onMessage: handleNewMessage,
    onSessionUpdate: handleSessionUpdate,
    enabled: !!session
  });

  // Check if session is stale (waiting too long)
  const isSessionStale = useCallback((s: ChatSession): boolean => {
    if (s.status !== 'waiting') return false;
    const age = Date.now() - new Date(s.started_at).getTime();
    return age > SESSION_STALE_TIMEOUT;
  }, []);

  // Cleanup stale session
  const cleanupStaleSession = async (sessionId: string) => {
    try {
      logger.debug('🧹 Cleaning up stale session:', sessionId);
      await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (err) {
      logger.error('Error cleaning up stale session:', err);
    }
  };

  // Check for existing session on mount
  const checkExistingSession = useCallback(async () => {
    if (!user) return;

    try {
      logger.debug('Checking for existing session...');
      
      // Check for active sessions first
      const { data: activeSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        logger.debug('Found active session:', activeSession.id);
        setSession(activeSession as ChatSession);
        await loadMessages(activeSession.id);
        return;
      }

      // Check for waiting sessions
      const { data: waitingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (waitingSession) {
        const typedSession = waitingSession as ChatSession;
        
        if (isSessionStale(typedSession)) {
          logger.debug('Found stale session, cleaning up');
          await cleanupStaleSession(typedSession.id);
          return;
        }

        logger.debug('Found waiting session:', typedSession.id);
        setSession(typedSession);
        await loadMessages(typedSession.id);
      }
    } catch (err) {
      logger.error('Error checking existing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to check session');
    }
  }, [user, loadMessages, isSessionStale, setError]);

  // Start a new session
  const startSession = useCallback(async (forceNew = false): Promise<ChatSession | null> => {
    if (!user) {
      logger.error('Cannot start session: no user');
      return null;
    }

    setSessionLoading(true);
    setError(null);

    try {
      // Cleanup existing waiting sessions if forcing new
      if (forceNew) {
        const { data: existingSessions } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'waiting');

        for (const s of existingSessions || []) {
          await cleanupStaleSession(s.id);
        }
      }

      // Create session using atomic function
      const { data, error: sessionError } = await supabase.rpc('start_chat_session_atomic', {
        p_user_id: user.id
      });

      if (sessionError) throw sessionError;

      const result = data as unknown as { success: boolean; error_code?: string; error_message?: string; data?: ChatSession };
      
      if (!result.success) {
        if (result.error_code === 'SESSION_EXISTS' && result.data) {
          logger.debug('Using existing session:', result.data.id);
          setSession(result.data);
          await loadMessages(result.data.id);
          return result.data;
        }
        throw new Error(result.error_message || 'Failed to create session');
      }

      const newSession = result.data as ChatSession;
      logger.debug('🆕 Session created:', newSession.id);
      setSession(newSession);
      await loadMessages(newSession.id);
      return newSession;
    } catch (err) {
      logger.error('Error starting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      return null;
    } finally {
      setSessionLoading(false);
    }
  }, [user, loadMessages, setError]);

  // Send message wrapper
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    await sendMessageBase(params, session?.id);
  }, [sendMessageBase, session?.id]);

  // End session
  const endSession = useCallback(async (reason = 'manual') => {
    if (!session || !user) return;

    try {
      logger.debug('Ending session:', session.id);
      
      const { data, error: endError } = await supabase.rpc('end_chat_session_atomic', {
        p_session_id: session.id,
        p_user_id: user.id,
        p_end_reason: reason
      });

      if (endError) throw endError;

      const result = data as { success: boolean };
      if (result.success) {
        setSession(null);
        clearMessages();
      }
    } catch (err) {
      logger.error('Error ending session:', err);
    }
  }, [session, user, clearMessages]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    setSession(null);
    clearMessages();
    await checkExistingSession();
  }, [clearMessages, checkExistingSession]);

  // Start fresh session
  const startFreshSession = useCallback(async () => {
    setSession(null);
    clearMessages();
    return startSession(true);
  }, [clearMessages, startSession]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      checkExistingSession();
    }
  }, [user, checkExistingSession]);

  return {
    session,
    messages,
    loading: sessionLoading || messagesLoading,
    error,
    connectionStatus,
    sendMessage,
    endSession,
    refreshSession,
    forceReconnect,
    startSession,
    startFreshSession,
    isSessionStale: session ? isSessionStale(session) : false
  };
};
