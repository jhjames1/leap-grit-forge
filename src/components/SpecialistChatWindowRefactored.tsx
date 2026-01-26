/**
 * Specialist-side chat window component
 * Clean implementation using unified chat hooks and components
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar, Phone, User, BookOpen } from 'lucide-react';
import { useSpecialistChat } from '@/hooks/chat/useSpecialistChat';
import { ChatMessageItem, ChatConnectionStatus, ChatInput } from './chat';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import SpecialistProposalStatus from './SpecialistProposalStatus';
import ChatAppointmentScheduler from './ChatAppointmentScheduler';
import SessionInactivityWarning from './SessionInactivityWarning';
import SpecialistContentBrowser from './SpecialistContentBrowser';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ChatSession } from '@/types/chat';

interface AppointmentProposal {
  id: string;
  title: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

interface SpecialistChatWindowRefactoredProps {
  session: ChatSession;
  onClose: () => void;
  onSessionUpdate?: (updatedSession: ChatSession) => void;
}

const SpecialistChatWindowRefactored: React.FC<SpecialistChatWindowRefactoredProps> = ({
  session: initialSession,
  onClose,
  onSessionUpdate
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [sessionProposal, setSessionProposal] = useState<AppointmentProposal | null>(null);
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, string>>({});
  const [inactivityWarning, setInactivityWarning] = useState<number>(0);
  const [contentBrowserOpen, setContentBrowserOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Use the unified specialist chat hook
  const {
    session,
    messages,
    loading,
    error,
    connectionStatus,
    sendMessage,
    endSession,
    refreshSession,
    forceReconnect,
    claimSession,
    specialistId
  } = useSpecialistChat({
    initialSession,
    onSessionUpdate
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Load proposal statuses for proposal messages
  useEffect(() => {
    const loadProposalStatuses = async () => {
      const proposalMessages = messages.filter(msg => 
        msg.metadata?.action_type === 'appointment_proposal' || 
        msg.metadata?.action_type === 'recurring_appointment_proposal'
      );
      
      const proposalIds = proposalMessages
        .map(msg => msg.metadata?.proposal_data?.id)
        .filter(Boolean);
      
      if (proposalIds.length === 0) return;
      
      try {
        const { data } = await supabase
          .from('appointment_proposals')
          .select('id, status')
          .in('id', proposalIds);
        
        const statusMap = (data || []).reduce((acc, p) => {
          acc[p.id] = p.status;
          return acc;
        }, {} as Record<string, string>);
        
        setProposalStatuses(statusMap);
      } catch (err) {
        logger.error('Failed to load proposal statuses:', err);
      }
    };
    
    loadProposalStatuses();
  }, [messages]);

  // Subscribe to proposal status updates
  useEffect(() => {
    if (!session.id) return;

    const channel = supabase
      .channel(`proposals-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointment_proposals',
          filter: `chat_session_id=eq.${session.id}`
        },
        (payload) => {
          const proposalId = payload.new?.id;
          const newStatus = payload.new?.status;
          
          if (proposalId && newStatus) {
            setProposalStatuses(prev => ({ ...prev, [proposalId]: newStatus }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  // Inactivity warning
  useEffect(() => {
    if (!session || session.status !== 'active' || !session.last_activity) {
      setInactivityWarning(0);
      return;
    }

    const checkInactivity = () => {
      const lastActivity = new Date(session.last_activity!).getTime();
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeUntilInactive = (5 * 60 * 1000) - timeSinceActivity;

      if (timeUntilInactive <= 60000 && timeUntilInactive > 0) {
        setInactivityWarning(Math.ceil(timeUntilInactive / 1000));
      } else if (timeUntilInactive <= 0) {
        endSession('inactivity_timeout');
        setInactivityWarning(0);
      } else {
        setInactivityWarning(0);
      }
    };

    checkInactivity();
    const interval = setInterval(checkInactivity, 1000);
    return () => clearInterval(interval);
  }, [session, endSession]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    await sendMessage({ content: messageInput });
    setMessageInput('');
    setInactivityWarning(0);
  };

  const handleEndSession = () => {
    endSession('manual');
  };

  const handleContentShare = (content: any) => {
    sendMessage({
      content: `📚 ${content.title}\n\n${content.content}`,
      message_type: 'text'
    });
    setContentBrowserOpen(false);
  };

  const isSessionEnded = session.status === 'ended';
  const isWaiting = session.status === 'waiting';
  const userName = `User #${session.session_number || 1}`;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="text-muted-foreground" size={16} />
            </div>
            <div>
              <h2 className="font-fjalla font-bold text-foreground">{userName}</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isSessionEnded ? 'bg-muted' : 
                  isWaiting ? 'bg-warning' : 
                  'bg-chat-active'
                }`} />
                <span className="text-sm text-muted-foreground capitalize">{session.status}</span>
                <ChatConnectionStatus 
                  connectionStatus={connectionStatus} 
                  onReconnect={forceReconnect} 
                  compact 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isSessionEnded && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setContentBrowserOpen(true)}
                  className="text-muted-foreground"
                >
                  <BookOpen size={16} className="mr-1" />
                  Resources
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowScheduler(true)}
                  className="text-muted-foreground"
                >
                  <Calendar size={16} className="mr-1" />
                  Schedule
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleEndSession}
                >
                  End Session
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {isWaiting && (
        <div className="bg-warning/10 border-b border-warning/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-warning text-sm">Session waiting - Click to claim</p>
            <Button size="sm" onClick={() => claimSession()} className="bg-warning text-warning-foreground">
              Claim Session
            </Button>
          </div>
        </div>
      )}

      {isSessionEnded && (
        <div className="bg-muted/50 border-b border-border p-3">
          <p className="text-muted-foreground text-sm text-center">This session has ended</p>
        </div>
      )}

      {/* Connection Status */}
      {!isSessionEnded && (
        <ChatConnectionStatus connectionStatus={connectionStatus} onReconnect={forceReconnect} />
      )}

      {/* Inactivity Warning */}
      {inactivityWarning > 0 && (
        <div className="p-4">
          <SessionInactivityWarning
            secondsRemaining={inactivityWarning}
            onExtendSession={() => sendMessage({ content: 'Session extended', message_type: 'system' })}
            onEndSession={handleEndSession}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatMessageItem message={msg} isOwnMessage={msg.sender_type === 'specialist'} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!isSessionEnded && (
        <ChatInput
          value={messageInput}
          onChange={setMessageInput}
          onSend={handleSendMessage}
          disabled={loading || isWaiting}
          placeholder={isWaiting ? "Claim session to send messages" : "Type your message..."}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SpecialistChatWindowRefactored;
