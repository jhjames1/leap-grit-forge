
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useConnectionTest } from './useConnectionTest';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'specialist';
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
}

export function useChatSession(specialistId?: string) {
  const { user } = useAuth();
  const connectionTest = useConnectionTest();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Log connection test results
  useEffect(() => {
    console.log('🔧 CONNECTION TEST:', connectionTest);
  }, [connectionTest]);

  // Helper function to check if a session is stale (older than 10 minutes for waiting sessions)
  const isSessionStale = (session: ChatSession): boolean => {
    if (session.status !== 'waiting') return false;
    
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    
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

  useEffect(() => {
    if (!session) return;

    console.log('🔴 PEER CLIENT: Setting up real-time subscription for session:', session.id);
    console.log('🔴 PEER CLIENT: User ID:', user?.id);
    
    // Load existing messages first
    loadMessages(session.id);
    
    setConnectionStatus('connecting');
    console.log('🔴 PEER CLIENT: Connection status set to connecting');
    
    // Force WebSocket transport and create a clean, simple channel 
    const channelName = `chat-simple-${session.id}`;
    console.log('🔴 PEER CLIENT: Creating channel:', channelName);
    
    // Remove any existing channels with the same name first
    supabase.removeAllChannels();
    
    const messagesChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: user?.id || 'anonymous' }
      }
    });

    console.log('🔴 PEER CLIENT: Channel created, setting up listeners...');
    
    messagesChannel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages'
    }, (payload) => {
      const messageTimestamp = new Date().toISOString();
      console.log(`🔴 PEER CLIENT: Message received via realtime at ${messageTimestamp}:`, payload);
      const newMessage = payload.new as ChatMessage;
      
      // Calculate delay from message creation
      const messageCreatedAt = new Date(newMessage.created_at).getTime();
      const receivedAt = new Date().getTime();
      const delayMs = receivedAt - messageCreatedAt;
      
      console.log(`📊 PEER CLIENT: Message delay: ${delayMs}ms (created: ${newMessage.created_at}, received: ${messageTimestamp})`);
      
      // Manual filter for this session
      if (newMessage.session_id !== session.id) {
        console.log('🚫 PEER CLIENT: Message filtered out, wrong session ID');
        return;
      }
      
      console.log('✅ PEER CLIENT: Message matches our session!', newMessage.content);
      setMessages(prev => {
        // CRITICAL FIX: Handle optimistic message replacement
        const existingIndex = prev.findIndex(msg => 
          msg.id === newMessage.id || 
          (msg.id.startsWith('temp-') && msg.content === newMessage.content && msg.sender_id === newMessage.sender_id)
        );
        
        if (existingIndex !== -1) {
          // Replace optimistic message with real one
          const updated = [...prev];
          updated[existingIndex] = newMessage;
          console.log('🔄 PEER CLIENT: Replaced optimistic message with real one');
          return updated;
        }
        
        // Add new message if it doesn't exist
        if (!prev.find(msg => msg.id === newMessage.id)) {
          const updated = [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          console.log('✅ PEER CLIENT: New message added instantly');
          return updated;
        }
        
        return prev;
      });
    });
    
    messagesChannel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions'
    }, (payload) => {
      console.log('🔴 PEER CLIENT: Session updated via realtime:', payload);
      const updatedSession = payload.new as ChatSession;
      if (updatedSession.id === session.id) {
        setSession(updatedSession);
      }
    });
    
    console.log('🔴 PEER CLIENT: Subscribing to channel...');
    messagesChannel.subscribe((status) => {
      console.log('🔴 PEER CLIENT: Subscription status changed to:', status);
      console.log('🔴 PEER CLIENT: Channel state:', messagesChannel.state);
      
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
        console.log('✅ PEER CLIENT: Real-time subscription ACTIVE - ready to receive messages');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnectionStatus('disconnected');
        console.log('❌ PEER CLIENT: Subscription FAILED, status:', status);
        console.log('❌ PEER CLIENT: Channel error details:', messagesChannel);
        
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          console.log('🔄 PEER CLIENT: Attempting to reconnect...');
          messagesChannel.subscribe();
        }, 3000);
      } else {
        console.log('🔄 PEER CLIENT: Status in progress:', status);
      }
    });

    console.log('🔴 PEER CLIENT: Subscription setup complete, waiting for connection...');

    return () => {
      console.log('🔌 PEER CLIENT: Cleaning up real-time subscription');
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
      } else {
        // Clean up any stale waiting sessions for this user
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
      }
      
      // Create new chat session using the atomic function for consistency
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
          // Session already exists, use it
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

      // Load existing messages immediately after setting session
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
      created_at: new Date().toISOString(),
      session_id: targetSessionId
    };

    // Add optimistic message immediately
    if (sender_type === 'user') {
      setMessages(prev => [...prev, optimisticMessage]);
      console.log('🚀 Peer client: Added optimistic message', content);
    }

    try {
      console.log('Sending message:', { content, message_type, sender_type, sessionId: targetSessionId });
      
      // Use the atomic message sending function for consistency
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
          console.log('❌ Peer client: Removed optimistic message due to error');
        }
        throw error;
      }

      const result = data as any;
      
      if (!result.success) {
        console.error('Message send failed:', result.error_message);
        // Remove optimistic message on error
        if (sender_type === 'user') {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          console.log('❌ Peer client: Removed optimistic message due to failure');
        }
        throw new Error(result.error_message || 'Failed to send message');
      }

      // Note: Don't replace optimistic message here - let real-time subscription handle it
      console.log('✅ Peer client: Message sent successfully, waiting for real-time confirmation');

      // Update session if it was modified
      if (result.data?.session) {
        setSession(result.data.session as ChatSession);
      }

      console.log('Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const endSession = async (reason: string = 'manual') => {
    if (!session || !user) return;

    try {
      console.log('Ending session:', session.id, 'with reason:', reason);
      
      // Use the atomic function for ending sessions
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

  // Force refresh session - useful for clearing ended sessions
  const refreshSession = async () => {
    setSession(null);
    setMessages([]);
    setError(null);
    await checkExistingSession();
  };

  // Start fresh session - abandons any existing waiting session
  const startFreshSession = async () => {
    setSession(null);
    setMessages([]);
    setError(null);
    return await startSession(true);
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
    refreshSession,
    startFreshSession,
    isSessionStale: session ? isSessionStale(session) : false
  };
}
