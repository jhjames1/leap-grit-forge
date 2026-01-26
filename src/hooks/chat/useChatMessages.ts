/**
 * Hook for managing chat messages
 * Handles loading, sending, and real-time updates
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ChatMessage, SendMessageParams } from '@/types/chat';

interface UseChatMessagesProps {
  sessionId: string | null;
  userId: string | null;
  senderType: 'user' | 'specialist';
}

export const useChatMessages = ({ sessionId, userId, senderType }: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages for a session
  const loadMessages = useCallback(async (targetSessionId?: string) => {
    const sid = targetSessionId || sessionId;
    if (!sid) return;

    try {
      setLoading(true);
      logger.debug('💾 Loading messages for session:', sid);
      
      const { data, error: loadError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at');

      if (loadError) throw loadError;

      logger.debug('💾 Loaded messages:', data?.length || 0);
      setMessages((data || []) as ChatMessage[]);
      setError(null);
    } catch (err) {
      logger.error('💾 Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Add a message from real-time subscription
  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages(prev => {
      // Check for optimistic message replacement
      const existingIndex = prev.findIndex(msg => 
        msg.id === newMessage.id || 
        (msg.id.startsWith('temp-') && 
         msg.content === newMessage.content && 
         msg.sender_id === newMessage.sender_id)
      );
      
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = newMessage;
        return updated;
      }
      
      // Add if doesn't exist
      if (!prev.find(msg => msg.id === newMessage.id)) {
        return [...prev, newMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      
      return prev;
    });
  }, []);

  // Send a message using atomic RPC
  const sendMessage = useCallback(async (
    params: SendMessageParams,
    targetSessionId?: string
  ) => {
    const sid = targetSessionId || sessionId;
    if (!sid || !userId) {
      logger.error('Cannot send message: missing session or user');
      return;
    }

    const { content, message_type = 'text', metadata } = params;

    // Add optimistic message for immediate feedback
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sid,
      sender_id: userId,
      sender_type: senderType,
      message_type,
      content,
      metadata,
      is_read: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);
    logger.debug('🚀 Sending message:', content.substring(0, 50));

    try {
      const { data, error: sendError } = await supabase.rpc('send_message_atomic', {
        p_session_id: sid,
        p_sender_id: userId,
        p_sender_type: senderType,
        p_content: content,
        p_message_type: message_type,
        p_metadata: metadata || null
      });

      if (sendError) throw sendError;

      const result = data as { success: boolean; error_message?: string };
      
      if (!result.success) {
        throw new Error(result.error_message || 'Failed to send message');
      }

      logger.debug('✅ Message sent successfully');
      setError(null);
    } catch (err) {
      logger.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [sessionId, userId, senderType]);

  // Clear messages (for session reset)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    loadMessages,
    addMessage,
    sendMessage,
    clearMessages,
    setError
  };
};
