
import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import ChatAppointmentScheduler from './ChatAppointmentScheduler';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  created_at: string;
  isOptimistic: boolean;
}

interface SpecialistChatWindowProps {
  session: ChatSession;
  onClose: () => void;
}

const SpecialistChatWindow: React.FC<SpecialistChatWindowProps> = ({
  session,
  onClose
}) => {
  const [message, setMessage] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [sessionProposal, setSessionProposal] = useState<AppointmentProposal | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [currentSession, setCurrentSession] = useState<ChatSession>(session);
  const [isActivatingSession, setIsActivatingSession] = useState(false);
  const [messageQueue, setMessageQueue] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  // Connection resilience state
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('Loading messages for session:', session.id);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at');

      if (error) throw error;

      console.log('Loaded messages:', data?.length || 0);
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionProposal = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_proposals')
        .select('*')
        .eq('chat_session_id', session.id)
        .maybeSingle();

      if (error) throw error;
      setSessionProposal(data as AppointmentProposal | null);
    } catch (err) {
      console.error('Error loading session proposal:', err);
    }
  };

  const deleteExpiredProposal = async () => {
    if (!sessionProposal) return;

    try {
      const { error } = await supabase
        .from('appointment_proposals')
        .delete()
        .eq('id', sessionProposal.id);

      if (error) throw error;
      
      setSessionProposal(null);
      console.log('Expired proposal deleted successfully');
    } catch (err) {
      console.error('Error deleting proposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete proposal');
    }
  };

  const setupRealTimeSubscription = () => {
    console.log('Setting up real-time subscription for session:', session.id);
    setConnectionStatus('connecting');
    
    const channel = supabase
      .channel(`specialist-chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new;
          setMessages(prev => {
            // Remove any optimistic message with the same content
            const withoutOptimistic = prev.filter(msg => 
              !(msg.isOptimistic && msg.content === newMessage.content && msg.sender_type === newMessage.sender_type)
            );
            
            // Avoid duplicates
            if (withoutOptimistic.find(msg => msg.id === newMessage.id)) {
              return withoutOptimistic;
            }
            
            return [...withoutOptimistic, newMessage].sort((a, b) => 
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
          console.log('Session updated via real-time:', payload);
          const updatedSession = payload.new as ChatSession;
          setCurrentSession(updatedSession);
          
          // Show success toast for session activation
          if (updatedSession.status === 'active' && currentSession.status === 'waiting') {
            toast({
              title: "Session Activated",
              description: "You are now connected to the user.",
              duration: 3000,
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
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          setReconnectAttempts(0);
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
          handleReconnection();
        }
      });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  };

  const handleReconnection = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    console.log(`Attempting reconnection in ${backoffDelay}ms (attempt ${reconnectAttempts + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      setupRealTimeSubscription();
    }, backoffDelay);
  };

  const processMessageQueue = async () => {
    if (messageQueue.length === 0) return;

    const queuedMessages = [...messageQueue];
    setMessageQueue([]);

    for (const messageData of queuedMessages) {
      try {
        await sendMessageToDatabase(messageData);
      } catch (err) {
        console.error('Failed to send queued message:', err);
        // Re-add to queue for retry
        setMessageQueue(prev => [...prev, messageData]);
      }
    }
  };

  const sendMessageToDatabase = async (messageData: { content: string; sender_type?: string }) => {
    if (!user) throw new Error('User not authenticated');

    // Get specialist ID for this user
    const { data: specialistData, error: specialistError } = await supabase
      .from('peer_specialists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (specialistError || !specialistData) {
      throw new Error('No specialist found for user');
    }

    // Send to database
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSession.id,
        sender_id: user.id,
        sender_type: messageData.sender_type || 'specialist',
        message_type: 'text',
        content: messageData.content
      });

    if (error) throw error;

    // Update session status if it's waiting
    if (currentSession.status === 'waiting') {
      await activateSession(specialistData.id);
    }
  };

  const activateSession = async (specialistId: string) => {
    setIsActivatingSession(true);
    
    try {
      console.log('Activating session:', currentSession.id);
      
      const updateData: any = { status: 'active' };
      
      // If session is unassigned, assign it to this specialist
      if (!currentSession.specialist_id) {
        updateData.specialist_id = specialistId;
      }

      const { data: updatedSessionData, error: updateError } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', currentSession.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Session activated successfully:', updatedSessionData);
      setCurrentSession(updatedSessionData as ChatSession);
      
      // Log session activation event
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'session_activated',
          type: 'chat_session',
          details: JSON.stringify({
            session_id: currentSession.id,
            specialist_id: specialistId,
            previous_status: 'waiting'
          })
        });

    } catch (err) {
      console.error('Error activating session:', err);
      throw err;
    } finally {
      setIsActivatingSession(false);
    }
  };

  const sendMessage = async (messageData: { content: string; sender_type?: string }) => {
    if (!user) return;

    try {
      // Add optimistic message immediately
      const optimisticMessage: OptimisticMessage = {
        id: `optimistic-${Date.now()}`,
        content: messageData.content,
        sender_type: messageData.sender_type || 'specialist',
        created_at: new Date().toISOString(),
        isOptimistic: true
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Try to send immediately, or queue if offline
      if (connectionStatus === 'connected') {
        await sendMessageToDatabase(messageData);
      } else {
        // Add to queue for retry
        setMessageQueue(prev => [...prev, messageData]);
        toast({
          title: "Message Queued",
          description: "Your message will be sent when connection is restored.",
          variant: "default",
        });
      }

      console.log('Message sent/queued successfully');
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.isOptimistic || msg.content !== messageData.content));
      
      // Add to queue for retry
      setMessageQueue(prev => [...prev, messageData]);
      
      // Show error toast
      toast({
        title: "Message Failed",
        description: "Message queued for retry. Check your connection.",
        variant: "destructive",
      });
    }
  };

  const endSession = async () => {
    try {
      await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);
      
      // Log session end event
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'session_ended',
          type: 'chat_session',
          details: JSON.stringify({
            session_id: session.id,
            duration_minutes: Math.round((Date.now() - new Date(session.started_at).getTime()) / (1000 * 60))
          })
        });
      
      toast({
        title: "Session Ended",
        description: "The chat session has been ended successfully.",
      });
      
      onClose();
    } catch (err) {
      console.error('Error ending session:', err);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize component
  useEffect(() => {
    loadMessages();
    loadSessionProposal();
    const cleanup = setupRealTimeSubscription();
    
    return cleanup;
  }, [session.id]);

  // Process queued messages when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && messageQueue.length > 0) {
      processMessageQueue();
    }
  }, [connectionStatus, messageQueue.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (hasInitiallyLoaded && messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, hasInitiallyLoaded]);

  // Set initial load flag after messages are loaded
  useEffect(() => {
    if (messages.length > 0 && !hasInitiallyLoaded) {
      setTimeout(() => {
        setHasInitiallyLoaded(true);
      }, 100);
    }
  }, [messages, hasInitiallyLoaded]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await sendMessage({ 
      content: message,
      sender_type: 'specialist'
    });
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = async () => {
    await endSession();
  };

  const handleSchedulerSuccess = () => {
    setShowScheduler(false);
    loadSessionProposal();
  };

  // Helper function to format session display name
  const formatSessionName = (session: ChatSession) => {
    let sessionName = `Session #${session.session_number}`;
    
    if (session.user_first_name) {
      const lastInitial = session.user_last_name ? ` ${session.user_last_name.charAt(0)}.` : '';
      sessionName += ` - ${session.user_first_name}${lastInitial}`;
    }
    
    return sessionName;
  };

  const getProposalStatusBadge = (proposal: AppointmentProposal) => {
    const variants = {
      'pending': 'secondary',
      'accepted': 'default',
      'rejected': 'destructive',
      'expired': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[proposal.status]}>
        {proposal.status}
      </Badge>
    );
  };

  const isProposalExpired = (proposal: AppointmentProposal) => {
    return new Date(proposal.expires_at) < new Date();
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'waiting': return 'bg-yellow-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionStatusText = (session: ChatSession) => {
    if (session.status === 'waiting' && !session.specialist_id) {
      return 'Available to claim';
    }
    if (session.status === 'waiting' && isActivatingSession) {
      return 'Activating...';
    }
    return session.status;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="text-primary" size={16} />
            </div>
            <div>
              <h3 className="font-semibold">{formatSessionName(currentSession)}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${getSessionStatusColor(currentSession.status)}`}></div>
                <span className="capitalize">
                  {getSessionStatusText(currentSession)}
                </span>
                {isActivatingSession && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-primary">Connecting...</span>
                  </div>
                )}
                <span>•</span>
                <span>Started {format(new Date(currentSession.started_at), 'h:mm a')}</span>
                {sessionProposal && (
                  <>
                    <span>•</span>
                    <span>1 proposal</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowScheduler(true)}
              className="text-primary border-primary/20 hover:bg-primary/10"
            >
              <Calendar size={16} className="mr-1" />
              Schedule
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleEndSession}
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              End Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-muted/50 border-b border-border p-3">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Shield size={16} />
          <span className="text-sm">Secure & Confidential Chat</span>
        </div>
      </div>

      {/* Session Proposal Section */}
      {sessionProposal && (
        <div className="bg-blue-50/50 border-b border-blue-200/50 p-3">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{sessionProposal.title}</h4>
              <div className="flex items-center space-x-2">
                {getProposalStatusBadge(sessionProposal)}
                {isProposalExpired(sessionProposal) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={deleteExpiredProposal}
                    className="text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                    title="Remove expired proposal"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>📅 {sessionProposal.start_date} at {sessionProposal.start_time}</div>
              <div>⏱️ {sessionProposal.duration} minutes • {sessionProposal.frequency}</div>
              <div>🔄 {sessionProposal.occurrences} session{sessionProposal.occurrences > 1 ? 's' : ''}</div>
              {sessionProposal.status === 'pending' && (
                <div className="text-orange-600">
                  ⏰ Expires {format(new Date(sessionProposal.expires_at), 'MMM d, h:mm a')}
                </div>
              )}
              {isProposalExpired(sessionProposal) && (
                <div className="text-red-600">
                  ❌ This proposal has expired
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {connectionStatus === 'connected' && (
        <div className="bg-green-500/10 border-b border-green-500/20 p-3">
          <p className="text-green-600 text-sm text-center flex items-center justify-center space-x-2">
            <CheckCircle size={16} />
            <span>Real-time chat connected</span>
          </p>
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3">
          <p className="text-yellow-600 text-sm text-center flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </p>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-3">
          <p className="text-orange-600 text-sm text-center flex items-center justify-center space-x-2">
            <AlertCircle size={16} />
            <span>Connection issue - Messages may be delayed</span>
            {reconnectAttempts > 0 && (
              <span>(Retry {reconnectAttempts}/{maxReconnectAttempts})</span>
            )}
          </p>
        </div>
      )}

      {/* Message Queue Status */}
      {messageQueue.length > 0 && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 p-3">
          <p className="text-blue-600 text-sm text-center">
            {messageQueue.length} message{messageQueue.length > 1 ? 's' : ''} queued for sending
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-3">
          <p className="text-red-600 text-sm text-center flex items-center justify-center space-x-2">
            <AlertCircle size={16} />
            <span>Error: {error}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="text-red-600 hover:bg-red-50 h-6 w-6 p-0"
            >
              <X size={12} />
            </Button>
          </p>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.sender_type === 'specialist' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  msg.sender_type === 'specialist' 
                    ? 'bg-primary text-primary-foreground' 
                    : msg.message_type === 'system'
                    ? 'bg-muted border border-border text-muted-foreground'
                    : 'bg-card border border-border text-card-foreground'
                 } rounded-2xl p-4 ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                  <p className="text-sm leading-relaxed mb-1">{msg.content}</p>
                  <p className={`text-xs ${
                    msg.sender_type === 'specialist' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {msg.isOptimistic ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>

              {/* Display appointment proposal handler if this is a proposal message */}
              {(msg.metadata?.action_type === 'appointment_proposal' || msg.metadata?.action_type === 'recurring_appointment_proposal') && (
                <AppointmentProposalHandler 
                  message={msg} 
                  isUser={msg.sender_type === 'user'} 
                  onResponse={() => {
                    console.log('Appointment proposal response handled');
                    loadSessionProposal();
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>
              {currentSession.status === 'waiting' && !currentSession.specialist_id 
                ? 'This session is waiting for a specialist. Send a message to claim it and begin the conversation.'
                : 'Chat session started. Send a message to begin the conversation.'
              }
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            onKeyPress={handleKeyPress}
            disabled={loading || isActivatingSession}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={loading || !message.trim() || isActivatingSession}
            className="px-6"
          >
            {isActivatingSession ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* Chat Appointment Scheduler */}
      <ChatAppointmentScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        specialistId={currentSession.specialist_id || ''}
        userId={currentSession.user_id}
        chatSessionId={currentSession.id}
        onScheduled={handleSchedulerSuccess}
      />
    </div>
  );
};

export default SpecialistChatWindow;
