import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeChat } from './useRealtimeChat';
import { sessionCleanup } from '@/utils/sessionCleanup';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'specialist' | 'system';
  message_type: 'text' | 'quick_action' | 'system' | 'phone_call_request';
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

export function useChatSession(specialistId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the new realtime hook with enhanced reconnection
  const { isConnected: realtimeConnected, forceReconnect: forceRealtimeReconnect } = useRealtimeChat({
    sessionId: session?.id || null,
    onMessage: (newMessage) => {
      console.log('✅ PEER CLIENT: New message received instantly via useRealtimeChat:', newMessage.content);
      console.log('🎯 PEER CLIENT: Message details:', {
        id: newMessage.id,
        sender_type: newMessage.sender_type,
        session_id: newMessage.session_id,
        current_session: session?.id
      });
      setMessages(prev => {
        // Handle optimistic message replacement
        const existingIndex = prev.findIndex(msg => 
          msg.id === newMessage.id || 
          (msg.id.startsWith('temp-') && msg.content === newMessage.content && msg.sender_id === newMessage.sender_id)
        );
        
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newMessage;
          return updated;
        }
        
        // Add new message if it doesn't exist
        if (!prev.find(msg => msg.id === newMessage.id)) {
          const updated = [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          return updated;
        }
        
        return prev;
      });
    },
    onSessionUpdate: (updatedSession) => {
      console.log('🔄 PEER CLIENT: Session updated via useRealtimeChat:', updatedSession);
      setSession(updatedSession);
    }
  });

  // Helper function to check if a session is stale
  const isSessionStale = (session: ChatSession): boolean => {
    if (session.status !== 'waiting') return false;
    
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    const tenMinutes = 10 * 60 * 1000;
    
    return sessionAge > tenMinutes;
  };

  // Helper function to clean up stale waiting sessions
  const cleanupStaleSession = async (sessionId: string) => {
    try {
      console.log('🧹 Cleaning up stale session:', sessionId);
      await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error cleaning up stale session:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    console.log('Setting up chat session for user:', user.id);
    checkExistingSession();
  }, [user]);

  const checkExistingSession = async () => {
    if (!user) return;

    try {
      console.log('Checking for existing session...');
      
      // Check for any active sessions first
      const { data: activeSession, error: activeError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError) {
        console.error('Error checking active sessions:', activeError);
        throw activeError;
      }

      if (activeSession) {
        console.log('Found active session:', activeSession);
        setSession(activeSession as ChatSession);
        await loadMessages(activeSession.id);
        return;
      }

      // Check for waiting sessions
      const { data: waitingSession, error: waitingError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (waitingError) {
        console.error('Error checking waiting sessions:', waitingError);
        throw waitingError;
      }

      if (waitingSession) {
        const waitingSessionTyped = waitingSession as ChatSession;
        
        // Check if the waiting session is stale
        if (isSessionStale(waitingSessionTyped)) {
          console.log('Found stale waiting session, cleaning up:', waitingSessionTyped.id);
          await cleanupStaleSession(waitingSessionTyped.id);
          console.log('No valid existing session found after cleanup');
          return;
        }

        console.log('Found valid waiting session:', waitingSessionTyped);
        setSession(waitingSessionTyped);
        await loadMessages(waitingSessionTyped.id);
        return;
      }

      console.log('No existing session found');
    } catch (err) {
      console.error('Error checking existing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to check existing session');
    }
  };

  const startSession = async (forceNew: boolean = false) => {
    if (!user) {
      console.error('Cannot start session: missing user');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting new chat session...', forceNew ? '(forced new)' : '');
      
      // If forcing new session, clean up any existing waiting sessions
      if (forceNew) {
        const { data: existingSessions } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'waiting');

        if (existingSessions) {
          for (const existingSession of existingSessions) {
            await cleanupStaleSession(existingSession.id);
          }
        }
      }
      
      // Create new chat session using the atomic function
      const { data: sessionResult, error: sessionError } = await supabase.rpc('start_chat_session_atomic', {
        p_user_id: user.id
      });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }

      const result = sessionResult as any;
      
      if (!result.success) {
        if (result.error_code === 'SESSION_EXISTS') {
          const existingSession = result.data as ChatSession;
          console.log('🔄 Using existing session:', existingSession);
          setSession(existingSession);
          await loadMessages(existingSession.id);
          return existingSession;
        } else {
          throw new Error(result.error_message || 'Failed to create session');
        }
      }

      const sessionData = result.data as ChatSession;
      console.log('🆕 Session created:', sessionData);
      setSession(sessionData);
      await loadMessages(sessionData.id);

      return sessionData;
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat session');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      console.log('💾 Loading messages for session:', sessionId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at');

      if (error) {
        console.error('💾 Error loading messages:', error);
        throw error;
      }

      console.log('💾 Loaded messages:', data?.length || 0, 'messages');
      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      console.error('💾 Error loading messages:', err);
    }
  };

  const sendMessage = async ({ 
    content, 
    message_type = 'text', 
    metadata,
    sender_type = 'user'
  }: {
    content: string;
    message_type?: 'text' | 'quick_action' | 'system' | 'phone_call_request';
    metadata?: any;
    sender_type?: 'user' | 'specialist';
  }, sessionId?: string) => {
    if (!user) {
      console.error('No user found for sending message');
      return;
    }

    const currentSession = session;
    const targetSessionId = sessionId || currentSession?.id;

    if (!targetSessionId) {
      console.error('No session found for sending message');
      setError('No active chat session');
      return;
    }

    // Create optimistic message for immediate UI update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      sender_type,
      message_type,
      content,
      metadata,
      is_read: false,
      created_at: new Date().toISOString(),
      session_id: targetSessionId
    };

    // Add optimistic message immediately for user messages
    if (sender_type === 'user') {
      setMessages(prev => [...prev, optimisticMessage]);
      console.log('🚀 Peer client: Added optimistic message', content);
    }

    try {
      console.log('Sending message:', { content, message_type, sender_type, sessionId: targetSessionId });
      
      const { data, error } = await supabase.rpc('send_message_atomic', {
        p_session_id: targetSessionId,
        p_sender_id: user.id,
        p_sender_type: sender_type,
        p_content: content,
        p_message_type: message_type,
        p_metadata: metadata
      });

      if (error) {
        console.error('Message send error:', error);
        // Remove optimistic message on error
        if (sender_type === 'user') {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        }
        throw error;
      }

      const result = data as any;
      
      if (!result.success) {
        console.error('Message send failed:', result.error_message);
        // Remove optimistic message on error
        if (sender_type === 'user') {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        }
        throw new Error(result.error_message || 'Failed to send message');
      }

      // Real-time subscription will handle replacing optimistic message
      console.log('✅ Peer client: Message sent successfully');

      // Update session if it was modified
      if (result.data?.session) {
        setSession(result.data.session as ChatSession);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const endSession = async (reason: string = 'manual') => {
    if (!session || !user) return;

    try {
      console.log('Ending session:', session.id, 'with reason:', reason);
      
      const { data, error } = await supabase.rpc('end_chat_session_atomic', {
        p_session_id: session.id,
        p_user_id: user.id,
        p_end_reason: reason
      });

      if (error) {
        console.error('Error ending session:', error);
        throw error;
      }

      const result = data as any;
      
      if (result.success) {
        setSession(null);
        setMessages([]);
      } else {
        throw new Error(result.error_message || 'Failed to end session');
      }
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const refreshSession = async () => {
    setSession(null);
    setMessages([]);
    setError(null);
    await checkExistingSession();
  };

  const startFreshSession = async () => {
    setSession(null);
    setMessages([]);
    setError(null);
    return await startSession(true);
  };

  // Enhanced force reconnect that refreshes all session data
  const forceReconnect = useCallback(async () => {
    console.log('🔄 PEER CLIENT: Force reconnecting and refreshing all session data');
    
    // Refresh session data from database
    if (session) {
      try {
        const { data: sessionData, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', session.id)
          .single();

        if (error) throw error;

        if (sessionData) {
          setSession(sessionData as ChatSession);
          console.log('✅ PEER CLIENT: Session data refreshed during reconnection');
        }
        
        // Reload messages to catch any missed during disconnection
        await loadMessages(session.id);
        console.log('✅ PEER CLIENT: Messages reloaded during reconnection');
        
      } catch (err) {
        console.error('❌ PEER CLIENT: Error refreshing session data during reconnection:', err);
      }
    }
    
    // Force reconnect the real-time connection
    forceRealtimeReconnect();
  }, [session, forceRealtimeReconnect]);

  return {
    session,
    messages,
    loading,
    error,
    connectionStatus: realtimeConnected ? 'connected' : 'disconnected',
    startSession,
    sendMessage,
    endSession,
    refreshSession,
    startFreshSession,
    forceReconnect,
    isSessionStale: session ? isSessionStale(session) : false
  };
}
