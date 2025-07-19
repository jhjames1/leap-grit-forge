
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
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Load messages and session proposal
  useEffect(() => {
    loadMessages();
    loadSessionProposal();
    setupRealTimeSubscription();
  }, [session.id]);

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
            // Avoid duplicates
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
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (messageData: { content: string; sender_type?: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          sender_id: user.id,
          sender_type: messageData.sender_type || 'specialist',
          message_type: 'text',
          content: messageData.content
        });

      if (error) throw error;

      console.log('Message sent successfully');
      
      // Update session status to active if it was waiting
      if (session.status === 'waiting') {
        await supabase
          .from('chat_sessions')
          .update({ status: 'active' })
          .eq('id', session.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
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
      
      onClose();
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              <h3 className="font-semibold">{formatSessionName(session)}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${
                  session.status === 'active' ? 'bg-green-500' : 
                  session.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <span className="capitalize">{session.status}</span>
                <span>•</span>
                <span>Started {format(new Date(session.started_at), 'h:mm a')}</span>
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
          <p className="text-green-600 text-sm text-center">
            ✓ Real-time chat connected
          </p>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-3">
          <p className="text-orange-600 text-sm text-center">
            ⚠ Connection issue - Messages may be delayed
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-3">
          <p className="text-red-600 text-sm text-center">Error: {error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                 } rounded-2xl p-4`}>
                  <p className="text-sm leading-relaxed mb-1">{msg.content}</p>
                  <p className={`text-xs ${
                    msg.sender_type === 'specialist' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>

              {/* Display appointment proposal handler if this is a proposal message */}
              {msg.metadata?.action_type === 'appointment_proposal' && (
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
            <p>Chat session started. Send a message to begin the conversation.</p>
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
            disabled={loading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="px-6"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {/* Chat Appointment Scheduler */}
      <ChatAppointmentScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        specialistId={session.specialist_id || ''}
        userId={session.user_id}
        chatSessionId={session.id}
        onScheduled={handleSchedulerSuccess}
      />
    </div>
  );
};

export default SpecialistChatWindow;
