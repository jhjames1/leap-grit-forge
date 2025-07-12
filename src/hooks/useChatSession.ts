
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

  useEffect(() => {
    if (!user || !specialistId) return;

    console.log('Setting up chat session for user:', user.id, 'specialist:', specialistId);
    checkExistingSession();
  }, [user, specialistId]);

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
    if (!user || !specialistId) return;

    try {
      console.log('Checking for existing session...');
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('specialist_id', specialistId)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing session:', error);
        throw error;
      }

      if (data) {
        console.log('Found existing session:', data);
        setSession(data as ChatSession);
        await loadMessages(data.id);
      } else {
        console.log('No existing session found');
      }
    } catch (err) {
      console.error('Error checking existing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to check existing session');
    }
  };

  const startSession = async () => {
    if (!user || !specialistId) {
      console.error('Cannot start session: missing user or specialist');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting new chat session...');
      
      // Create new chat session
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          specialist_id: specialistId,
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
        content: 'Chat session started. You are now connected with a peer specialist.',
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

      // Update session to active if it was waiting
      if (currentSession && currentSession.status === 'waiting') {
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

  return {
    session,
    messages,
    loading,
    error,
    connectionStatus,
    startSession,
    sendMessage,
    endSession
  };
}
