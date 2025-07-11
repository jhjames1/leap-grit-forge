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

  useEffect(() => {
    if (!user || !specialistId) return;

    // Check for existing active session
    checkExistingSession();

    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, specialistId]);

  const checkExistingSession = async () => {
    if (!user || !specialistId) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('specialist_id', specialistId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSession(data as ChatSession);
        await loadMessages(data.id);
      }
    } catch (err) {
      console.error('Error checking existing session:', err);
    }
  };

  const startSession = async () => {
    if (!user || !specialistId) return;

    setLoading(true);
    setError(null);

    try {
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

      if (sessionError) throw sessionError;

      setSession(sessionData as ChatSession);

      // Send initial system message
      await sendMessage({
        content: 'Chat session started. You are now connected with a peer specialist.',
        message_type: 'system'
      });

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
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at');

      if (error) throw error;

      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const sendMessage = async ({ 
    content, 
    message_type = 'text', 
    metadata 
  }: {
    content: string;
    message_type?: 'text' | 'quick_action' | 'system';
    metadata?: any;
  }) => {
    if (!user || !session) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          sender_id: user.id,
          sender_type: 'user',
          message_type,
          content,
          metadata
        });

      if (error) throw error;

      // Update session to active if it was waiting
      if (session.status === 'waiting') {
        await supabase
          .from('chat_sessions')
          .update({ status: 'active' })
          .eq('id', session.id);
        
        setSession(prev => prev ? { ...prev, status: 'active' } : null);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
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
    startSession,
    sendMessage,
    endSession
  };
}