import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Calendar, Phone, Video, User, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useRobustRealtimeConnection } from '@/hooks/useRobustRealtimeConnection';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import SpecialistProposalStatus from './SpecialistProposalStatus';
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
  created_at: string;
  updated_at: string;
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

interface RealMessage {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string;
  session_id: string;
  message_type: string;
  metadata?: any;
  created_at: string;
  is_read?: boolean;
}

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
  const [messageInput, setMessageInput] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [sessionProposal, setSessionProposal] = useState<AppointmentProposal | null>(null);
  const [session, setSession] = useState<ChatSession>(initialSession);
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Handle real-time message updates
  const handleNewMessage = useCallback((payload: any) => {
    logger.debug('🔴 SPECIALIST: New message received via realtime:', payload.new);
    const newMessage = payload.new as RealMessage;
    
    if (newMessage.session_id === session.id) {
      setMessages(prev => {
        const exists = prev.find(msg => msg.id === newMessage.id);
        if (exists) return prev;
        
        return [...prev, newMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      
      // If this is a proposal message, load its status
      if (newMessage.metadata?.action_type === 'appointment_proposal' || 
          newMessage.metadata?.action_type === 'recurring_appointment_proposal') {
        loadProposalStatuses([newMessage]);
      }
    }
  }, [session.id]);

  // Handle real-time session updates
  const handleSessionUpdate = useCallback((payload: any) => {
    logger.debug('🔴 SPECIALIST: Session update received via realtime:', payload.new);
    const updatedSession = payload.new as ChatSession;
    
    if (updatedSession.id === session.id) {
      // Check if this is a timeout event
      const isTimeout = updatedSession.status === 'ended' && 
        (updatedSession.end_reason === 'auto_timeout' || updatedSession.end_reason === 'inactivity_timeout');

      if (isTimeout) {
        toast({
          title: "Session Timed Out",
          description: "This chat session has been automatically ended due to inactivity. The window will close in a few seconds.",
          variant: "destructive"
        });
      }

      setSession(prevSession => ({
        ...prevSession,
        ...updatedSession,
        user_first_name: updatedSession.user_first_name || prevSession.user_first_name,
        user_last_name: updatedSession.user_last_name || prevSession.user_last_name
      }));

      if (onSessionUpdate) {
        onSessionUpdate(updatedSession);
      }
    }
  }, [session.id, onSessionUpdate, toast]);

  // Use robust real-time connection
  const { connectionStatus, forceReconnect, isConnected } = useRobustRealtimeConnection({
    sessionId: session.id,
    onMessage: handleNewMessage,
    onSessionUpdate: handleSessionUpdate,
    enabled: true
  });

  // Get specialist ID on mount
  useEffect(() => {
    const getSpecialistId = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();
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
      setLoading(true);
      logger.debug('Loading messages for session:', session.id);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at');

      if (error) throw error;
      
      console.log('Messages loaded:', data?.length, 'messages');
      setMessages(data || []);
      
      // Load proposal statuses for any proposal messages
      const proposalMessages = (data || []).filter(msg => 
        typeof msg.metadata === 'object' && 
        msg.metadata !== null &&
        'action_type' in msg.metadata &&
        (msg.metadata.action_type === 'appointment_proposal' || 
         msg.metadata.action_type === 'recurring_appointment_proposal')
      );
      
      if (proposalMessages.length > 0) {
        await loadProposalStatuses(proposalMessages);
      }
      
      // Also load session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', session.id)
        .single();
        
      if (sessionError) throw sessionError;
      
      const updatedSession = sessionData as ChatSession;
      setSession(updatedSession);
      if (onSessionUpdate) {
        onSessionUpdate(updatedSession);
      }
    } catch (err) {
      logger.error('Failed to load messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [session.id, user, onSessionUpdate]);

  // Load proposal statuses for proposal messages
  const loadProposalStatuses = useCallback(async (proposalMessages: RealMessage[]) => {
    try {
      const proposalIds = proposalMessages
        .map(msg => msg.metadata?.proposal_data?.id)
        .filter(Boolean);
      
      if (proposalIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('appointment_proposals')
        .select('id, status')
        .in('id', proposalIds);
      
      if (error) throw error;
      
      const statusMap = (data || []).reduce((acc, proposal) => {
        acc[proposal.id] = proposal.status;
        return acc;
      }, {} as Record<string, string>);
      
      setProposalStatuses(statusMap);
    } catch (err) {
      logger.error('Failed to load proposal statuses:', err);
    }
  }, []);

  // Load session proposal
  const loadSessionProposal = useCallback(async () => {
    try {
      const { data, error } = await supabase
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

  // Enhanced claim session with immediate state update
  const claimSession = useCallback(async () => {
    if (!user || !specialistId || session.status !== 'waiting') return;
    try {
      logger.debug('Claiming session:', session.id);

      const { data, error } = await supabase.rpc('claim_chat_session', {
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
        throw new Error(result?.error || 'Failed to claim session');
      }
      
      const confirmedSession = result.session!;
      logger.debug('Session claim confirmed:', confirmedSession);

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
      toast({
        title: "Error",
        description: "Failed to claim session. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, specialistId, session, onSessionUpdate, toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !specialistId) return;

    // Auto-claim waiting sessions
    if (session.status === 'waiting') {
      await claimSession();
    }

    try {
      console.log('🚀 Specialist sending message:', content);
      
      const { data, error } = await supabase.rpc('send_message_atomic', {
        p_session_id: session.id,
        p_sender_id: user.id,
        p_sender_type: 'specialist',
        p_content: content,
        p_message_type: 'text',
        p_metadata: null
      });

      if (error) throw error;
      
      const result = data as {
        success: boolean;
        error_code?: string;
        error_message?: string;
      };

      if (!result.success) {
        throw new Error(result.error_message || 'Failed to send message');
      }

      console.log('✅ Specialist: Message sent successfully via atomic function');
    } catch (err) {
      logger.error('Failed to send message:', err);
      console.log('❌ Specialist: Message send failed:', err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, specialistId, session.id, session.status, claimSession, toast]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    console.log('Sending message:', messageInput, 'Session status:', session.status);
    
    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = async () => {
    if (!user || !specialistId) return;
    try {
      logger.debug('Ending session with correct parameters', {
        sessionId: session.id,
        userId: user.id,
        specialistId: specialistId
      });
      
      const { data, error } = await supabase.rpc('end_chat_session', {
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

  // Initialize on mount
  useEffect(() => {
    if (user) {
      loadMessages();
      loadSessionProposal();
    }
  }, [user, loadMessages, loadSessionProposal]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }, [messages]);

  // Auto-claim waiting sessions when component mounts
  useEffect(() => {
    if (session.status === 'waiting' && specialistId) {
      claimSession();
    }
  }, [session.status, specialistId, claimSession]);

  // Update session state when prop changes
  useEffect(() => {
    if (initialSession.id !== session.id || initialSession.status !== session.status || initialSession.specialist_id !== session.specialist_id) {
      setSession(initialSession);
    }
  }, [initialSession, session.id, session.status, session.specialist_id]);

  const getSessionAge = () => {
    const age = Date.now() - new Date(session.started_at).getTime();
    const minutes = Math.floor(age / (1000 * 60));
    return minutes < 1 ? 'just now' : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  };
  
  const isSessionEnded = session.status === 'ended';
  const isInputEnabled = session && !isSessionEnded && (session.status === 'active' || session.status === 'waiting');

  const isSpecialistProposal = (msg: RealMessage) => {
    if (!specialistId || !msg.metadata?.proposal_data) return false;
    return msg.metadata.proposal_data.specialist_id === specialistId;
  };

  return (
    <Card className="h-[600px] flex flex-col bg-card border border-border shadow-sm">
      
      {/* Enhanced Header with connection status */}
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
          <ConnectionStatusIndicator 
            connectionStatus={connectionStatus}
            onReconnect={forceReconnect}
            compact={true}
          />
          
          {!isSessionEnded && (
            <Button size="sm" variant="destructive" onClick={handleEndSession} disabled={loading}>
              <X size={12} className="mr-1" />
              End Chat
            </Button>
          )}
          
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X size={12} />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {isSessionEnded && (
        <div className="bg-muted/50 border-b border-border p-3">
          <p className="text-muted-foreground text-sm text-center">
            This chat session has ended. {session.end_reason && `Reason: ${session.end_reason}`}
          </p>
        </div>
      )}

      {session.status === 'waiting' && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="text-center">
            <p className="text-yellow-800 text-sm font-medium mb-2">
              This session is waiting to be claimed
            </p>
            <Button size="sm" onClick={claimSession} disabled={!specialistId} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Claim Session
            </Button>
          </div>
        </div>
      )}

      {!isConnected && !isSessionEnded && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-destructive text-sm">
              ⚠ Connection issue - Messages may be delayed
            </p>
            <ConnectionStatusIndicator 
              connectionStatus={connectionStatus}
              onReconnect={forceReconnect}
              compact={false}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-3">
          <p className="text-red-600 text-sm text-center">Error: {error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'specialist' ? 'items-end' : msg.message_type === 'system' ? 'items-center' : 'items-start'}`}>
              {/* Check if this is an appointment proposal message */}
              {msg.message_type === 'system' && (msg.metadata?.action_type === 'appointment_proposal' || msg.metadata?.action_type === 'recurring_appointment_proposal') ? (
                <div className="w-full max-w-md">
                  {isSpecialistProposal(msg) ? (
                    <SpecialistProposalStatus 
                      message={msg} 
                      proposalStatus={proposalStatuses[msg.metadata?.proposal_data?.id] || 'pending'}
                    />
                  ) : (
                    <AppointmentProposalHandler 
                      message={msg} 
                      isUser={false} 
                      onResponse={() => {
                        loadSessionProposal();
                        loadProposalStatuses([msg]);
                      }}
                    />
                  )}
                </div>
              ) : (
                <>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.sender_type === 'specialist' 
                      ? 'bg-gray-100 text-gray-900' 
                      : msg.message_type === 'system' 
                        ? 'bg-muted text-muted-foreground border border-border' 
                        : 'bg-green-100 text-gray-900'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2 mt-1 px-1">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), 'h:mm a')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Proposal Section */}
      {sessionProposal && sessionProposal.status === 'pending' && (
        <div className="border-t border-border p-3">
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
      {showScheduler && (
        <ChatAppointmentScheduler 
          isOpen={showScheduler} 
          onClose={() => setShowScheduler(false)} 
          specialistId={specialistId || ''} 
          userId={session.user_id} 
          chatSessionId={session.id} 
          onScheduled={() => {
            setShowScheduler(false);
            loadSessionProposal();
          }} 
        />
      )}
    </Card>
  );
};

export default RobustSpecialistChatWindow;
