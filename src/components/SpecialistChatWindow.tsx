
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
  ChevronDown,
  ChevronUp,
  Plus
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
  const [showProposals, setShowProposals] = useState(false);
  const [proposals, setProposals] = useState<AppointmentProposal[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Load messages for this specific session
  useEffect(() => {
    loadMessages();
    loadProposals();
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

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_proposals')
        .select('*')
        .eq('user_id', session.user_id)
        .eq('specialist_id', session.specialist_id)
        .order('proposed_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (err) {
      console.error('Error loading proposals:', err);
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
          filter: `user_id=eq.${session.user_id}`
        },
        () => {
          loadProposals();
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
    loadProposals();
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

  const pendingProposals = proposals.filter(p => p.status === 'pending');

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
                <span>Started {format(new Date(session.started_at), 'HH:mm')}</span>
                {proposals.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{proposals.length} proposal{proposals.length > 1 ? 's' : ''}</span>
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

      {/* Proposals Section */}
      {proposals.length > 0 && (
        <div className="bg-blue-50/50 border-b border-blue-200/50">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100/50 transition-colors"
            onClick={() => setShowProposals(!showProposals)}
          >
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Appointment Proposals ({proposals.length})
              </span>
              {pendingProposals.length > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {pendingProposals.length} pending
                </Badge>
              )}
            </div>
            {showProposals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {showProposals && (
            <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
              {proposals.map(proposal => (
                <div key={proposal.id} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{proposal.title}</h4>
                    {getProposalStatusBadge(proposal)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>📅 {proposal.start_date} at {proposal.start_time}</div>
                    <div>⏱️ {proposal.duration} minutes • {proposal.frequency}</div>
                    <div>🔄 {proposal.occurrences} session{proposal.occurrences > 1 ? 's' : ''}</div>
                    {proposal.status === 'pending' && (
                      <div className="text-orange-600">
                        ⏰ Expires {format(new Date(proposal.expires_at), 'MMM d, h:mm a')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    loadProposals();
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
