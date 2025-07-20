import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Calendar, 
  Phone, 
  Video, 
  User,
  Shield,
  Clock,
  X,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
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
  const [showScheduler, setShowScheduler] = useState(false);
  const [sessionProposal, setSessionProposal] = useState<AppointmentProposal | null>(null);
  const [session, setSession] = useState<ChatSession>(initialSession);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const { user } = useAuth();
  const { toast } = useToast();
  const chatOperations = useChatOperations();

  const MESSAGE_TIMEOUT = 15000;
  const RECONNECT_INTERVAL = 5000;

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      const sessionData = await chatOperations.getSessionWithMessages(session.id);
      if (sessionData && !sessionData.error) {
        setMessages(sessionData.messages || []);
        if (sessionData.session) {
          setSession(sessionData.session);
        }
      }
    } catch (err) {
      logger.error('Failed to load messages:', err);
    }
  }, [session.id, chatOperations]);

  // Load session proposal
  const loadSessionProposal = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_proposals')
        .select('*')
        .eq('chat_session_id', session.id)
        .maybeSingle();

      if (error) throw error;
      setSessionProposal(data as AppointmentProposal | null);
    } catch (err) {
      logger.error('Error loading session proposal:', err);
    }
  }, [session.id]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) return;

    logger.debug('Setting up realtime subscription for session:', session.id);
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`robust-specialist-chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          logger.debug('New message received via realtime:', payload);
          const newMessage = payload.new as RealMessage;
          
          setMessages(prev => {
            // Remove matching optimistic message
            const withoutOptimistic = prev.filter(msg => 
              !(msg.isOptimistic && 
                msg.content === newMessage.content && 
                msg.sender_type === newMessage.sender_type &&
                Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 30000)
            );
            
            // Avoid duplicates
            if (withoutOptimistic.find(msg => msg.id === newMessage.id)) {
              return withoutOptimistic;
            }
            
            // Add new message and sort
            const updated = [...withoutOptimistic, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            return updated;
          });

          // Clear timeouts for successful messages
          messageTimeoutsRef.current.forEach((timeout, messageId) => {
            clearTimeout(timeout);
            messageTimeoutsRef.current.delete(messageId);
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
          logger.debug('Session updated via realtime:', payload);
          const updatedSession = payload.new as ChatSession;
          setSession(updatedSession);
          
          if (onSessionUpdate) {
            onSessionUpdate(updatedSession);
          }

          // Show toast for status changes
          if (updatedSession.status === 'active' && session.status === 'waiting') {
            toast({
              title: "Session Activated",
              description: "You are now connected to the user.",
            });
          } else if (updatedSession.status === 'ended' && session.status !== 'ended') {
            toast({
              title: "Session Ended",
              description: "This chat session has been ended.",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_proposals',
          filter: `chat_session_id=eq.${session.id}`
        },
        () => {
          loadSessionProposal();
        }
      )
      .subscribe((status) => {
        logger.debug('Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
          scheduleReconnection();
        }
      });

    channelRef.current = channel;
  }, [session.id, onSessionUpdate, loadSessionProposal]);

  // Schedule reconnection
  const scheduleReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      logger.debug('Attempting to reconnect realtime...');
      cleanupRealtimeSubscription();
      setupRealtimeSubscription();
    }, RECONNECT_INTERVAL);
  }, [setupRealtimeSubscription]);

  // Cleanup realtime subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
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
  }, []);

  // Send message with optimistic updates
  const sendMessage = useCallback(async (messageData: MessageData) => {
    if (!user) return;

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
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id && msg.isOptimistic
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      }
    } catch (err) {
      logger.error('Failed to send message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id && msg.isOptimistic
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [user, session.id, chatOperations]);

  // Retry failed message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.isOptimistic);
    if (!failedMessage) return;

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

      await sendMessage(messageData);
      
      // Remove the failed message since sendMessage will create a new optimistic one
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
    } catch (err) {
      logger.error('Failed to retry message:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId && msg.isOptimistic
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  }, [messages, sendMessage]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await sendMessage({
      content: message,
      sender_type: 'specialist'
    });
    
    setMessage('');
  };

  // Handle ending session with proper specialist permission
  const handleEndSession = async () => {
    if (!user) return;
    
    try {
      logger.debug('Ending session with specialist permissions', {
        sessionId: session.id,
        userId: user.id,
        sessionUserId: session.user_id,
        specialistId: session.specialist_id
      });

      // Use the dedicated end_chat_session function for specialists
      const { data, error } = await supabase.rpc('end_chat_session', {
        p_session_id: session.id,
        p_user_id: user.id, // Current user (specialist)
        p_specialist_id: session.specialist_id
      });

      if (error) throw error;

      const response = data as { success: boolean; session?: any; error?: string };

      if (response?.success) {
        toast({
          title: "Session Ended",
          description: "The chat session has been ended successfully."
        });
        
        // Update the session in parent component
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize on mount
  useEffect(() => {
    loadMessages();
    loadSessionProposal();
    setupRealtimeSubscription();

    return cleanupRealtimeSubscription;
  }, [loadMessages, loadSessionProposal, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  const getSessionAge = () => {
    const age = Date.now() - new Date(session.started_at).getTime();
    const minutes = Math.floor(age / (1000 * 60));
    return minutes < 1 ? 'just now' : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  };

  const isSessionEnded = session.status === 'ended';

  return (
    <Card className="h-[600px] flex flex-col bg-background border border-steel-dark">
      {/* Header */}
      <div className="bg-midnight/90 backdrop-blur-sm border-b border-steel-dark p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-steel rounded-full flex items-center justify-center">
            <User className="text-white" size={14} />
          </div>
          <div>
            <h3 className="font-oswald font-semibold text-white text-sm">
              {session.user_first_name || 'Anonymous'} {session.user_last_name || 'User'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                session.status === 'active' ? 'bg-green-500' :
                session.status === 'waiting' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`}></div>
              <p className="text-steel-light text-xs">
                Session #{session.session_number} • {getSessionAge()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection status */}
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} title={`Connection: ${connectionStatus}`} />
          
          {!isSessionEnded && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndSession}
              className="h-8 px-3 text-xs"
              disabled={chatOperations.loading}
            >
              <X size={12} className="mr-1" />
              End Chat
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 px-3 text-xs text-steel-light hover:text-white"
          >
            <X size={12} />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {isSessionEnded && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3">
          <p className="text-yellow-600 text-sm text-center">
            This chat session has ended. {session.end_reason && `Reason: ${session.end_reason}`}
          </p>
        </div>
      )}

      {session.status === 'waiting' && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 p-3">
          <p className="text-blue-600 text-sm text-center">
            Waiting for specialist to join this session...
          </p>
        </div>
      )}

      {connectionStatus === 'disconnected' && !isSessionEnded && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-3">
          <p className="text-orange-600 text-sm text-center">
            ⚠ Connection issue - Messages may be delayed
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${
                msg.sender_type === 'specialist' ? 'items-end' : 
                msg.message_type === 'system' ? 'items-center' : 'items-start'
              }`}
            >
              <div className={`max-w-[80%] ${
                msg.sender_type === 'specialist' 
                  ? 'bg-steel text-white' 
                  : msg.message_type === 'system'
                  ? 'bg-construction/20 text-construction border border-construction/30'
                  : 'bg-white/10 backdrop-blur-sm text-muted-foreground'
                } rounded-2xl p-3 ${
                  msg.isOptimistic && msg.status === 'failed' ? 'border border-red-500/50' : ''
                } ${
                  msg.isOptimistic && msg.status === 'timeout' ? 'border border-orange-500/50' : ''
                }`}>
                <p className="text-sm leading-relaxed mb-1">{msg.content}</p>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${
                    msg.sender_type === 'specialist' ? 'text-white/70' : 
                    msg.message_type === 'system' ? 'text-construction/70' : 'text-steel-light'
                  }`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                  
                  {/* Message status indicators */}
                  {msg.isOptimistic && (
                    <div className="flex items-center space-x-1 ml-2">
                      {msg.status === 'sending' && (
                        <Clock size={10} className="text-white/50 animate-pulse" />
                      )}
                      {msg.status === 'failed' && (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle size={10} className="text-red-400" />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-3 px-1 text-xs text-red-400 hover:text-red-300"
                            onClick={() => retryFailedMessage(msg.id)}
                          >
                            <RotateCcw size={8} className="mr-1" />
                            Retry
                          </Button>
                        </div>
                      )}
                      {msg.status === 'timeout' && (
                        <div className="flex items-center space-x-1">
                          <Clock size={10} className="text-orange-400" />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-3 px-1 text-xs text-orange-400 hover:text-orange-300"
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
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-steel-light py-8">
            <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Proposal Section */}
      {sessionProposal && sessionProposal.status === 'pending' && (
        <div className="border-t border-steel-dark p-3">
          <AppointmentProposalHandler 
            message={{ 
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
            }}
            isUser={false}
            onResponse={() => loadSessionProposal()}
          />
        </div>
      )}

      {/* Input Section */}
      <div className="bg-midnight/90 backdrop-blur-sm border-t border-steel-dark p-4">
        {!isSessionEnded ? (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white/10 border-steel-dark text-white placeholder:text-steel-light text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={chatOperations.loading}
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-steel hover:bg-steel-light text-white px-4"
                disabled={!message.trim() || chatOperations.loading}
                size="sm"
              >
                <Send size={14} />
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowScheduler(true)}
                className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              >
                <Calendar size={14} className="mr-1" />
                Schedule Appointment
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-steel-light py-2">
            <p className="text-sm">This chat session has ended.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RobustSpecialistChatWindow;
