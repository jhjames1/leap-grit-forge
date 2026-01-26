/**
 * Specialist-side chat hook
 * Manages chat sessions and messages for peer specialists
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useChatRealtime } from './useChatRealtime';
import { useChatMessages } from './useChatMessages';
import type { ChatSession, SpecialistChatHookResult, SendMessageParams } from '@/types/chat';

interface UseSpecialistChatProps {
  initialSession: ChatSession;
  onSessionUpdate?: (session: ChatSession) => void;
}

export const useSpecialistChat = ({ 
  initialSession,
  onSessionUpdate 
}: UseSpecialistChatProps): SpecialistChatHookResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ChatSession>(initialSession);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
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
    sessionId: session.id,
    userId: user?.id || null,
    senderType: 'specialist'
  });

  // Handle real-time updates
  const handleNewMessage = useCallback((message: any) => {
    logger.debug('📨 Specialist chat: New message received');
    if (message.session_id === session.id) {
      addMessage(message);
    }
  }, [session.id, addMessage]);

  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    logger.debug('📋 Specialist chat: Session updated:', updatedSession.status);
    
    if (updatedSession.id === session.id) {
      // Check for timeout
      const isTimeout = updatedSession.status === 'ended' && 
        (updatedSession.end_reason === 'auto_timeout' || updatedSession.end_reason === 'inactivity_timeout');

      if (isTimeout) {
        toast({
          title: "Session Timed Out",
          description: "This chat session has been automatically ended due to inactivity.",
          variant: "destructive"
        });
      }

      setSession(updatedSession);
      onSessionUpdate?.(updatedSession);
    }
  }, [session.id, onSessionUpdate, toast]);

  const { connectionStatus, forceReconnect, isConnected } = useChatRealtime({
    sessionId: session.id,
    onMessage: handleNewMessage,
    onSessionUpdate: handleSessionUpdate,
    enabled: true
  });

  // Get specialist ID on mount
  useEffect(() => {
    const fetchSpecialistId = async () => {
      if (!user) return;
      try {
        const { data, error: err } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (err) throw err;
        setSpecialistId(data.id);
      } catch (err) {
        logger.error('Failed to get specialist ID:', err);
      }
    };
    fetchSpecialistId();
  }, [user]);

  // Load initial messages
  useEffect(() => {
    if (user) {
      loadMessages(session.id);
    }
  }, [user, session.id, loadMessages]);

  // Update session when prop changes
  useEffect(() => {
    if (initialSession.id !== session.id || 
        initialSession.status !== session.status || 
        initialSession.specialist_id !== session.specialist_id) {
      setSession(initialSession);
    }
  }, [initialSession, session.id, session.status, session.specialist_id]);

  // Claim a waiting session
  const claimSession = useCallback(async () => {
    if (!user || !specialistId || session.status !== 'waiting') return;

    try {
      logger.debug('Claiming session:', session.id);

      const { data, error: claimError } = await supabase.rpc('claim_chat_session', {
        p_session_id: session.id,
        p_specialist_user_id: user.id
      });

      if (claimError) throw claimError;
      
      const result = data as unknown as {
        success: boolean;
        error?: string;
        session?: ChatSession;
      };
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to claim session');
      }
      
      const claimedSession = result.session!;
      logger.debug('Session claimed:', claimedSession.id);

      setSession(claimedSession);
      onSessionUpdate?.(claimedSession);
      
      toast({
        title: "Session Claimed",
        description: "You are now connected to this user."
      });
    } catch (err) {
      logger.error('Failed to claim session:', err);
      toast({
        title: "Error",
        description: "Failed to claim session. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, specialistId, session, onSessionUpdate, toast]);

  // Auto-claim waiting sessions when specialist opens chat
  useEffect(() => {
    if (session.status === 'waiting' && specialistId) {
      claimSession();
    }
  }, [session.status, specialistId, claimSession]);

  // Send message (auto-claims if needed)
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    if (!specialistId) {
      setError('Specialist ID not found');
      return;
    }

    // Auto-claim if waiting
    if (session.status === 'waiting') {
      await claimSession();
    }

    await sendMessageBase(params, session.id);
  }, [specialistId, session.status, session.id, claimSession, sendMessageBase, setError]);

  // End session
  const endSession = useCallback(async (reason = 'manual') => {
    if (!user || !specialistId) return;

    try {
      logger.debug('Ending session:', session.id);
      
      const { data, error: endError } = await supabase.rpc('end_chat_session', {
        p_session_id: session.id,
        p_user_id: user.id,
        p_specialist_id: specialistId
      });
      
      if (endError) throw endError;
      
      const response = data as unknown as {
        success: boolean;
        session?: ChatSession;
        error?: string;
      };
      
      if (response?.success) {
        toast({
          title: "Session Ended",
          description: "The chat session has been ended successfully."
        });
        if (response.session) {
          setSession(response.session);
          onSessionUpdate?.(response.session);
        }
      } else {
        throw new Error(response?.error || 'Failed to end session');
      }
    } catch (err) {
      logger.error('Failed to end session:', err);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, specialistId, session.id, onSessionUpdate, toast]);

  // Refresh session data
  const refreshSession = useCallback(async () => {
    try {
      const { data, error: refreshError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', session.id)
        .single();
        
      if (refreshError) throw refreshError;
      
      const refreshedSession = data as ChatSession;
      setSession(refreshedSession);
      onSessionUpdate?.(refreshedSession);
      await loadMessages(session.id);
    } catch (err) {
      logger.error('Failed to refresh session:', err);
    }
  }, [session.id, loadMessages, onSessionUpdate]);

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
    claimSession,
    specialistId
  };
};
