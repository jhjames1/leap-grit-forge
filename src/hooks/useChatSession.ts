
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'specialist';
  message_type: 'text' | 'quick_action' | 'system';
  content: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}

export function useChatSession(specialistId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Helper function to check if a session is stale (older than 30 minutes for waiting sessions)
  const isSessionStale = (session: ChatSession): boolean => {
    if (session.status !== 'waiting') return false;
    
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    return sessionAge > thirtyMinutes;
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

  useEffect(() => {
    if (!session) return;

    console.log('🔴 Setting up real-time subscription for session:', session.id);
    
    // Load existing messages first
    loadMessages(session.id);
    
    setConnectionStatus('connecting');
    
    // Set up real-time subscription for messages with optimized channel
    const messagesChannel = supabase
      .channel(`chat-messages-${session.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user?.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('📨 New message received via realtime:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates by checking if message already exists
            if (prev.find(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
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
          console.log('📡 Session updated via realtime:', payload);
          const updatedSession = payload.new as ChatSession;
          setSession(updatedSession);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      setConnectionStatus('disconnected');
      supabase.removeChannel(messagesChannel);
    };
  }, [session]);

  const checkExistingSession = async () => {
    if (!user) return;

    try {
      console.log('Checking for existing session...');
      
      // Check for any active sessions first (these take priority)
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
          // Don't set this session, let user start fresh
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

  const startSession = async () => {
    if (!user) {
      console.error('Cannot start session: missing user');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting new chat session...');
      
      // First, clean up any stale waiting sessions for this user
      const { data: staleWaitingSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'waiting');

      if (staleWaitingSessions) {
        for (const staleSession of staleWaitingSessions) {
          if (isSessionStale(staleSession as ChatSession)) {
            await cleanupStaleSession(staleSession.id);
          }
        }
      }
      
      // Create new chat session without a specific specialist - any available specialist can pick it up
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          specialist_id: null,
          status: 'waiting'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }

      console.log('🆕 Session created:', sessionData);
      setSession(sessionData as ChatSession);

      // Load existing messages immediately after setting session
      await loadMessages(sessionData.id);

      // Send initial system message
      await sendMessage({
        content: 'Chat session started. You are now in the queue to be connected with a Peer Support Specialist.',
        message_type: 'system'
      }, sessionData.id);

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
      console.log('💾 Message details:', data);
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
    message_type?: 'text' | 'quick_action' | 'system';
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
      created_at: new Date().toISOString()
    };

    // Add optimistic message immediately
    if (sender_type === 'user') {
      setMessages(prev => [...prev, optimisticMessage]);
    }

    try {
      console.log('Sending message:', { content, message_type, sender_type, sessionId: targetSessionId });
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: targetSessionId,
          sender_id: user.id,
          sender_type,
          message_type,
          content,
          metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Message send error:', error);
        // Remove optimistic message on error
        if (sender_type === 'user') {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        }
        throw error;
      }

      // Replace optimistic message with real one
      if (sender_type === 'user' && data) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? data as ChatMessage : msg
        ));
      }

      console.log('Message sent successfully');

      // If this is a specialist's first message to a waiting session, assign them to it
      if (sender_type === 'specialist' && currentSession && currentSession.status === 'waiting' && !currentSession.specialist_id) {
        // Find the specialist ID for this user
        const { data: specialistData } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (specialistData) {
          const { error: updateError } = await supabase
            .from('chat_sessions')
            .update({ 
              status: 'active',
              specialist_id: specialistData.id
            })
            .eq('id', currentSession.id);

          if (!updateError) {
            setSession(prev => prev ? { ...prev, status: 'active', specialist_id: specialistData.id } : null);
          }
        }
      } else if (currentSession && currentSession.status === 'waiting') {
        // Update session to active if it was waiting (for regular user messages)
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({ status: 'active' })
          .eq('id', currentSession.id);

        if (updateError) {
          console.error('Error updating session status:', updateError);
        } else {
          setSession(prev => prev ? { ...prev, status: 'active' } : null);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const endSession = async (reason: string = 'manual') => {
    if (!session) return;

    try {
      console.log('Ending session:', session.id, 'with reason:', reason);
      await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);

      setSession(null);
      setMessages([]);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  // Force refresh session - useful for clearing ended sessions
  const refreshSession = async () => {
    setSession(null);
    setMessages([]);
    setError(null);
    await checkExistingSession();
  };

  return {
    session,
    messages,
    loading,
    error,
    connectionStatus,
    startSession,
    sendMessage,
    endSession,
    refreshSession
  };
}
