import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Calendar, Phone, Video, User, Shield, Clock, X, Trash2, AlertCircle, CheckCircle, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatOperations, MessageData } from '@/hooks/useChatOperations';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import ChatAppointmentScheduler from './ChatAppointmentScheduler';
import { format } from 'date-fns';
interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  session_number: number;
  user_first_name?: string;
  user_last_name?: string;
  last_activity?: string;
  end_reason?: string;
}
interface AppointmentProposal {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time: string;
  duration: number;
  frequency: string;
  occurrences: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
  proposed_at: string;
  responded_at?: string;
}
interface OptimisticMessage {
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
interface RealMessage {
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
type ChatMessage = OptimisticMessage | RealMessage;
interface RobustSpecialistChatWindowProps {
  session: ChatSession;
  onClose: () => void;
  onSessionUpdate?: (updatedSession: ChatSession) => void;
}
const RobustSpecialistChatWindow: React.FC<RobustSpecialistChatWindowProps> = ({
  session: initialSession,
  onClose,
  onSessionUpdate
}) => {
  const [message, setMessage] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [sessionProposal, setSessionProposal] = useState<AppointmentProposal | null>(null);
  const [session, setSession] = useState<ChatSession>(initialSession);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected'); // Default to connected for testing
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Add ref to track session updates
  const sessionUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const chatOperations = useChatOperations();
  const MESSAGE_TIMEOUT = 15000;
  const RECONNECT_INTERVAL = 5000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);

  // Get specialist ID on mount
  useEffect(() => {
    const getSpecialistId = async () => {
      if (!user) return;
      try {
        const {
          data,
          error
        } = await supabase.from('peer_specialists').select('id').eq('user_id', user.id).single();
        if (error) throw error;
        setSpecialistId(data.id);
      } catch (err) {
        logger.error('Failed to get specialist ID:', err);
      }
    };
    getSpecialistId();
  }, [user]);

  // Load initial messages and session data
  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      logger.debug('Loading messages for session:', session.id);
      const sessionData = await chatOperations.getSessionWithMessages(session.id);
      if (sessionData && !sessionData.error) {
        console.log('Messages loaded:', sessionData.messages?.length, 'messages');
        console.log('Message types:', sessionData.messages?.map(m => ({
          id: m.id, 
          type: m.message_type, 
          sender: m.sender_type, 
          hasMetadata: !!m.metadata,
          actionType: m.metadata?.action_type
        })));
        setMessages(sessionData.messages || []);
        if (sessionData.session) {
          const updatedSession = sessionData.session as ChatSession;
          setSession(updatedSession);
          if (onSessionUpdate) {
            onSessionUpdate(updatedSession);
          }
        }
      }
    } catch (err) {
      logger.error('Failed to load messages:', err);
      toast({
        title: "Error Loading Messages",
        description: "Could not load chat history. Please refresh.",
        variant: "destructive"
      });
    }
  }, [session.id, chatOperations, user, onSessionUpdate, toast]);

  // Load session proposal
  const loadSessionProposal = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase
        .from('appointment_proposals')
        .select('*')
        .eq('chat_session_id', session.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setSessionProposal(data as AppointmentProposal | null);
    } catch (err) {
      logger.error('Error loading session proposal:', err);
    }
  }, [session.id]);

  // Enhanced session update handler
  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    logger.debug('RobustSpecialistChatWindow: Session update received', {
      sessionId: updatedSession.id,
      oldStatus: session.status,
      newStatus: updatedSession.status,
      oldSpecialistId: session.specialist_id,
      newSpecialistId: updatedSession.specialist_id
    });

    // Update local session state immediately
    setSession(prevSession => {
      const mergedSession = {
        ...prevSession,
        ...updatedSession,
        // Ensure we keep user display names if they exist
        user_first_name: updatedSession.user_first_name || prevSession.user_first_name,
        user_last_name: updatedSession.user_last_name || prevSession.user_last_name
      };
      logger.debug('RobustSpecialistChatWindow: Updated local session state', mergedSession);
      return mergedSession;
    });

    // Debounce parent callback to prevent rapid updates
    if (sessionUpdateTimeoutRef.current) {
      clearTimeout(sessionUpdateTimeoutRef.current);
    }
    sessionUpdateTimeoutRef.current = setTimeout(() => {
      if (onSessionUpdate) {
        logger.debug('RobustSpecialistChatWindow: Calling parent onSessionUpdate');
        onSessionUpdate(updatedSession);
      }
    }, 100);
  }, [session.status, session.specialist_id, onSessionUpdate]);

  // Cleanup function for real-time subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      logger.debug('Cleaning up realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Clear all message timeouts
    messageTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    messageTimeoutsRef.current.clear();
    setConnectionStatus('disconnected');
  }, []);

  // Enhanced real-time subscription with better session update handling
  const setupRealtimeSubscription = useCallback(() => {
    if (channelRef.current || !session?.id) return;
    logger.debug('Setting up realtime subscription for session:', session.id);
    setConnectionStatus('connecting');
    reconnectAttemptsRef.current = 0;
    const channelName = `specialist-robust-chat-${session.id}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `session_id=eq.${session.id}`
    }, payload => {
      logger.debug('New message received via realtime:', payload);
      console.log('Realtime message details:', {
        messageType: payload.new.message_type,
        senderType: payload.new.sender_type,
        hasMetadata: !!payload.new.metadata,
        actionType: payload.new.metadata?.action_type
      });
      const newMessage = payload.new as RealMessage;
      setMessages(prev => {
        // Remove matching optimistic message
        const withoutOptimistic = prev.filter(msg => !(msg.isOptimistic && msg.content === newMessage.content && msg.sender_type === newMessage.sender_type && Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 30000));

        // Avoid duplicates
        if (withoutOptimistic.find(msg => msg.id === newMessage.id)) {
          return withoutOptimistic;
        }

        // Add new message and sort
        const updated = [...withoutOptimistic, newMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return updated;
      });

      // Clear timeouts for successful messages
      messageTimeoutsRef.current.forEach((timeout, messageId) => {
        clearTimeout(timeout);
        messageTimeoutsRef.current.delete(messageId);
      });
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions',
      filter: `id=eq.${session.id}`
    }, async payload => {
      logger.debug('Session updated via realtime:', payload);
      const updatedSession = payload.new as ChatSession;

      // Fetch user details if not present
      if (!updatedSession.user_first_name && updatedSession.user_id) {
        try {
          const {
            data: profile
          } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', updatedSession.user_id).single();
          if (profile) {
            updatedSession.user_first_name = profile.first_name;
            updatedSession.user_last_name = profile.last_name;
          }
        } catch (err) {
          logger.debug('Could not fetch user profile:', err);
        }
      }

      // Handle the session update
      handleSessionUpdate(updatedSession);

      // Show appropriate toasts for status changes
      if (updatedSession.status === 'active' && session.status === 'waiting') {
        toast({
          title: "Session Activated",
          description: "You are now connected to the user."
        });
      } else if (updatedSession.status === 'ended' && session.status !== 'ended') {
        toast({
          title: "Session Ended",
          description: "This chat session has been ended."
        });
      }
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointment_proposals',
      filter: `chat_session_id=eq.${session.id}`
    }, () => {
      loadSessionProposal();
    }).subscribe(status => {
      logger.debug('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnectionStatus('disconnected');
        scheduleReconnection();
      }
    });
    channelRef.current = channel;
  }, [session.id, handleSessionUpdate, loadSessionProposal, toast]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      setConnectionStatus('disconnected');
      return;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    const delay = Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current), 30000);
    reconnectAttemptsRef.current++;
    logger.debug(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    reconnectTimeoutRef.current = setTimeout(() => {
      cleanupRealtimeSubscription();
      setupRealtimeSubscription();
    }, delay);
  }, [cleanupRealtimeSubscription, setupRealtimeSubscription]);

  // Enhanced claim session with immediate state update
  const claimSession = useCallback(async () => {
    if (!user || !specialistId || session.status !== 'waiting') return;
    try {
      logger.debug('Claiming session:', session.id);

      // Optimistically update UI immediately
      const optimisticSession = {
        ...session,
        status: 'active' as const,
        specialist_id: specialistId,
        updated_at: new Date().toISOString()
      };
      setSession(optimisticSession);

      // Immediately notify parent of the optimistic update
      if (onSessionUpdate) {
        onSessionUpdate(optimisticSession);
      }

      // Use the secure claim_chat_session function
      const {
        data,
        error
      } = await supabase.rpc('claim_chat_session', {
        p_session_id: session.id,
        p_specialist_user_id: user.id
      });
      if (error) throw error;
      const result = data as unknown as {
        success: boolean;
        error?: string;
        session?: ChatSession;
      };
      if (!result?.success) {
        // Revert optimistic update on failure
        setSession(session);
        if (onSessionUpdate) {
          onSessionUpdate(session);
        }
        throw new Error(result?.error || 'Failed to claim session');
      }
      const confirmedSession = result.session!;
      logger.debug('Session claim confirmed:', confirmedSession);

      // Update with confirmed data
      setSession(confirmedSession);
      if (onSessionUpdate) {
        onSessionUpdate(confirmedSession);
      }
      toast({
        title: "Session Claimed",
        description: "You are now connected to this user."
      });
    } catch (err) {
      logger.error('Failed to claim session:', err);

      // Revert optimistic update
      setSession(session);
      if (onSessionUpdate) {
        onSessionUpdate(session);
      }
      toast({
        title: "Error",
        description: "Failed to claim session. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, specialistId, session, onSessionUpdate, toast]);

  // Send message with proper session activation
  const sendMessage = useCallback(async (messageData: MessageData) => {
    if (!user || !specialistId) return;

    // Auto-claim waiting sessions
    if (session.status === 'waiting') {
      await claimSession();
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
      sender_type: messageData.sender_type || 'specialist',
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
      setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id && msg.isOptimistic ? {
        ...msg,
        status: 'timeout' as const
      } : msg));
    }, MESSAGE_TIMEOUT);
    messageTimeoutsRef.current.set(optimisticMessage.id, timeoutId);
    try {
      const result = await chatOperations.sendMessage(session.id, {
        ...messageData,
        sender_type: 'specialist'
      });
      if (!result.success) {
        // Mark message as failed
        setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id && msg.isOptimistic ? {
          ...msg,
          status: 'failed' as const
        } : msg));
      }
    } catch (err) {
      logger.error('Failed to send message:', err);
      setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id && msg.isOptimistic ? {
        ...msg,
        status: 'failed' as const
      } : msg));
    }
  }, [user, specialistId, session.id, session.status, chatOperations, claimSession]);

  // Retry failed message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.isOptimistic);
    if (!failedMessage) return;

    // Update status to sending
    setMessages(prev => prev.map(msg => msg.id === messageId && msg.isOptimistic ? {
      ...msg,
      status: 'sending' as const
    } : msg));
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
      setMessages(prev => prev.map(msg => msg.id === messageId && msg.isOptimistic ? {
        ...msg,
        status: 'failed' as const
      } : msg));
    }
  }, [messages, sendMessage]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    console.log('Sending message:', messageInput, 'Session status:', session.status);
    
    await sendMessage({
      content: messageInput,
      sender_type: 'specialist'
    });
    setMessageInput('');
  };

  // Handle key press for Enter to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle ending session with correct parameters
  const handleEndSession = async () => {
    if (!user || !specialistId) return;
    try {
      logger.debug('Ending session with correct parameters', {
        sessionId: session.id,
        userId: user.id,
        specialistId: specialistId
      });
      const {
        data,
        error
      } = await supabase.rpc('end_chat_session', {
        p_session_id: session.id,
        p_user_id: user.id,
        p_specialist_id: specialistId
      });
      if (error) throw error;
      const response = data as {
        success: boolean;
        session?: any;
        error?: string;
      };
      if (response?.success) {
        toast({
          title: "Session Ended",
          description: "The chat session has been ended successfully."
        });
        if (onSessionUpdate && response.session) {
          onSessionUpdate(response.session);
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
  };

  // Update session state when prop changes
  useEffect(() => {
    logger.debug('RobustSpecialistChatWindow: Session prop changed', {
      oldId: session.id,
      newId: initialSession.id,
      oldStatus: session.status,
      newStatus: initialSession.status
    });
    if (initialSession.id !== session.id || initialSession.status !== session.status || initialSession.specialist_id !== session.specialist_id) {
      setSession(initialSession);
    }
  }, [initialSession, session.id, session.status, session.specialist_id]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitializedRef.current && user) {
      isInitializedRef.current = true;
      loadMessages();
      loadSessionProposal();
      setupRealtimeSubscription();
    }
    return cleanupRealtimeSubscription;
  }, [user, loadMessages, loadSessionProposal, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Auto-claim waiting sessions when component mounts
  useEffect(() => {
    if (session.status === 'waiting' && specialistId) {
      claimSession();
    }
  }, [session.status, specialistId, claimSession]);
  const getSessionAge = () => {
    const age = Date.now() - new Date(session.started_at).getTime();
    const minutes = Math.floor(age / (1000 * 60));
    return minutes < 1 ? 'just now' : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  };
  
  const isSessionEnded = session.status === 'ended';
  
  // Check if input should be enabled - simplified logic
  const isInputEnabled = session && !isSessionEnded && (session.status === 'active' || session.status === 'waiting');
  
  console.log('Input enabled check:', {
    session: !!session,
    isSessionEnded,
    sessionStatus: session?.status,
    connectionStatus,
    isInputEnabled
  });

  return <Card className="h-[600px] flex flex-col bg-card border border-border shadow-sm">
      {/* Enhanced Header with better session info display */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <User className="text-muted-foreground" size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {session.user_first_name || 'Anonymous'} {session.user_last_name || 'User'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-green-500' : session.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
              <p className="text-muted-foreground text-sm">
                Session #{session.session_number} • {getSessionAge()}
                {session.specialist_id && session.status === 'active' && <span className="ml-1 text-green-600">• Active</span>}
                {session.status === 'waiting' && <span className="ml-1 text-yellow-600">• Waiting</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection status indicator */}
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} title={`Connection: ${connectionStatus}`} />
          
          {!isSessionEnded && <Button size="sm" variant="destructive" onClick={handleEndSession} disabled={chatOperations.loading}>
              <X size={12} className="mr-1" />
              End Chat
            </Button>}
          
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X size={12} />
          </Button>
        </div>
      </div>

      {/* Enhanced Status Messages */}
      {isSessionEnded && <div className="bg-muted/50 border-b border-border p-3">
          <p className="text-muted-foreground text-sm text-center">
            This chat session has ended. {session.end_reason && `Reason: ${session.end_reason}`}
          </p>
        </div>}

      {session.status === 'waiting' && <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="text-center">
            <p className="text-yellow-800 text-sm font-medium mb-2">
              This session is waiting to be claimed
            </p>
            <Button size="sm" onClick={claimSession} disabled={!specialistId} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Claim Session
            </Button>
          </div>
        </div>}

      {connectionStatus === 'disconnected' && !isSessionEnded && <div className="bg-destructive/10 border-b border-destructive/20 p-3">
          <p className="text-destructive text-sm text-center">
            ⚠ Connection issue - Messages may be delayed
          </p>
        </div>}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? messages.map(msg => <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'specialist' ? 'items-end' : msg.message_type === 'system' ? 'items-center' : 'items-start'}`}>
              {/* Check if this is an appointment proposal message */}
              {msg.message_type === 'system' && msg.metadata?.action_type === 'appointment_proposal' ? (
                <div className="w-full max-w-md">
                  <AppointmentProposalHandler 
                    message={msg} 
                    isUser={false} 
                    onResponse={() => loadSessionProposal()} 
                  />
                </div>
              ) : (
                <>
                  {/* Regular Message Bubble */}
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.sender_type === 'specialist' 
                      ? 'bg-gray-100 text-gray-900' 
                      : msg.message_type === 'system' 
                        ? 'bg-muted text-muted-foreground border border-border' 
                        : 'bg-green-100 text-gray-900'
                    } ${msg.isOptimistic && msg.status === 'failed' ? 'ring-1 ring-red-300' : ''} ${msg.isOptimistic && msg.status === 'timeout' ? 'ring-1 ring-yellow-300' : ''}`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </>
              )}
              
              {/* Timestamp and Status Row */}
              <div className="flex items-center gap-2 mt-1 px-1">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), 'h:mm a')}
                </p>
                
                {/* Message status indicators */}
                {msg.isOptimistic && (
                  <div className="flex items-center gap-1">
                    {msg.status === 'sending' && (
                      <Clock size={10} className="text-muted-foreground animate-pulse" />
                    )}
                    {msg.status === 'failed' && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={10} className="text-destructive" />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-4 px-1 text-xs text-destructive hover:text-destructive/80" 
                          onClick={() => retryFailedMessage(msg.id)}
                        >
                          <RotateCcw size={8} className="mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}
                    {msg.status === 'timeout' && (
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-yellow-600" />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-4 px-1 text-xs text-yellow-600 hover:text-yellow-500" 
                          onClick={() => retryFailedMessage(msg.id)}
                        >
                          <RotateCcw size={8} className="mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>) : <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
          </div>}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Proposal Section */}
      {sessionProposal && sessionProposal.status === 'pending' && <div className="border-t border-border p-3">
          <AppointmentProposalHandler message={{
        id: sessionProposal.id,
        content: '',
        metadata: {
          action_type: 'recurring_appointment_proposal',
          proposal_data: {
            id: sessionProposal.id,
            title: sessionProposal.title,
            description: sessionProposal.description || '',
            start_date: sessionProposal.start_date,
            start_time: sessionProposal.start_time,
            duration: sessionProposal.duration.toString(),
            frequency: sessionProposal.frequency,
            occurrences: sessionProposal.occurrences.toString()
          }
        }
      }} isUser={false} onResponse={() => loadSessionProposal()} />
        </div>}

      {/* Input Section - Simplified conditions */}
      {!isSessionEnded && (
        <div className="border-t border-border">
          {/* Action Buttons */}
          <div className="flex gap-2 p-3 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScheduler(true)}
              className="gap-2"
              disabled={!isInputEnabled}
            >
              <Calendar className="w-4 h-4" />
              Schedule Meeting
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Handle phone call */}}
              className="gap-2"
              disabled={!isInputEnabled}
            >
              <Phone className="w-4 h-4" />
              Phone Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Handle video call */}}
              className="gap-2"
              disabled={!isInputEnabled}
            >
              <Video className="w-4 h-4" />
              Video Call
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex gap-2 p-3">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                session?.status === 'waiting' 
                  ? "Type your message to start the conversation..." 
                  : "Type your message..."
              }
              disabled={!isInputEnabled}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isInputEnabled}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Scheduler Modal */}
      {showScheduler && <ChatAppointmentScheduler isOpen={showScheduler} onClose={() => setShowScheduler(false)} specialistId={specialistId || ''} userId={session.user_id} chatSessionId={session.id} onScheduled={() => {
      setShowScheduler(false);
      loadSessionProposal();
    }} />}
    </Card>;
};

export default RobustSpecialistChatWindow;
