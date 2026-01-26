/**
 * User-side peer chat component
 * Clean implementation using unified chat hooks and components
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Shield, Plus, Clock } from 'lucide-react';
import PeerSelection from './PeerSelection';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import SessionInactivityWarning from './SessionInactivityWarning';
import PhoneCallHandler from './PhoneCallHandler';
import { PeerSpecialist } from '@/hooks/usePeerSpecialists';
import { useUserChat } from '@/hooks/chat/useUserChat';
import { useRealtimeSpecialistStatus } from '@/hooks/useRealtimeSpecialistStatus';
import { sessionCleanup } from '@/utils/sessionCleanup';
import { ChatMessageItem, ChatConnectionStatus, ChatInput, QuickActions } from './chat';
import { QUICK_ACTION_MESSAGES, type QuickActionType } from '@/types/chat';

interface PeerChatProps {
  onBack?: () => void;
}

const PeerChat: React.FC<PeerChatProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'selection' | 'chat'>('selection');
  const [selectedPeer, setSelectedPeer] = useState<PeerSpecialist | null>(null);
  const [message, setMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [inactivityWarning, setInactivityWarning] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Get real-time status for selected specialist
  const { getStatusDisplay } = useRealtimeSpecialistStatus(selectedPeer?.id);

  // Use the unified chat hook
  const {
    session,
    messages,
    loading,
    error,
    connectionStatus,
    startSession,
    sendMessage,
    endSession,
    startFreshSession,
    forceReconnect,
    isSessionStale
  } = useUserChat(selectedPeer?.id);

  const handleSelectPeer = async (peer: PeerSpecialist) => {
    setSelectedPeer(peer);
    setCurrentView('chat');
    setIsInitialized(false);
  };

  // Initialize session when peer is selected
  useEffect(() => {
    if (currentView === 'chat' && selectedPeer && !session && !isInitialized && !loading) {
      setIsInitialized(true);
      startSession();
    }
  }, [currentView, selectedPeer, session, isInitialized, loading, startSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Monitor session inactivity
  useEffect(() => {
    if (!session || session.status !== 'active' || !session.last_activity) {
      setInactivityWarning(0);
      return;
    }

    const checkInactivity = () => {
      const timeUntilInactive = sessionCleanup.getTimeUntilInactive(session);
      if (timeUntilInactive <= 60 && timeUntilInactive > 0) {
        setInactivityWarning(timeUntilInactive);
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
    if (!message.trim()) return;
    await sendMessage({ content: message });
    setMessage('');
    setInactivityWarning(0);
  };

  const handleQuickAction = async (actionType: QuickActionType) => {
    const messageText = QUICK_ACTION_MESSAGES[actionType];
    await sendMessage({
      content: messageText,
      message_type: 'quick_action',
      metadata: { action_type: actionType }
    });
    setInactivityWarning(0);
  };

  const handleExtendSession = () => {
    if (session) {
      sendMessage({
        content: 'Session extended by user',
        message_type: 'system'
      });
      setInactivityWarning(0);
    }
  };

  const handleStartNewChat = async () => {
    await startFreshSession();
    setIsInitialized(true);
    setInactivityWarning(0);
  };

  const getSessionAge = () => {
    if (!session) return '';
    const age = Date.now() - new Date(session.started_at).getTime();
    const minutes = Math.floor(age / (1000 * 60));
    return minutes < 1 ? 'just now' : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  };

  // Show peer selection view
  if (currentView === 'selection') {
    return <PeerSelection onBack={onBack || (() => {})} onSelectPeer={handleSelectPeer} />;
  }

  const isSessionEnded = session && session.status === 'ended';
  const isWaitingAndStale = session && session.status === 'waiting' && isSessionStale;

  return (
    <div className="flex flex-col h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('selection')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="text-muted-foreground" size={16} />
            </div>
            <div>
              <h2 className="font-fjalla font-bold text-foreground">
                {selectedPeer?.first_name} {selectedPeer?.last_name}
              </h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusDisplay().colorClass}`} />
                <p className="text-muted-foreground text-sm">{getStatusDisplay().displayText}</p>
                <ChatConnectionStatus 
                  connectionStatus={connectionStatus} 
                  onReconnect={forceReconnect} 
                  compact 
                />
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartNewChat}
            className="border-primary text-gray-950 bg-yellow-400 hover:bg-yellow-300"
          >
            <Plus size={16} className="mr-1" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-muted/50 border-b border-border p-3">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Shield size={16} />
          <span className="text-sm font-fjalla font-bold">SECURE & CONFIDENTIAL CHAT</span>
        </div>
      </div>

      {/* Inactivity Warning */}
      {inactivityWarning > 0 && (
        <div className="p-4">
          <SessionInactivityWarning
            secondsRemaining={inactivityWarning}
            onExtendSession={handleExtendSession}
            onEndSession={() => endSession('manual')}
          />
        </div>
      )}

      {/* Status Indicators */}
      {loading && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 p-3">
          <p className="text-blue-600 text-sm text-center">Connecting to chat...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3">
          <p className="text-destructive text-sm">Error: {error}</p>
        </div>
      )}

      {/* Connection Status */}
      {session && !isSessionEnded && (
        <ChatConnectionStatus connectionStatus={connectionStatus} onReconnect={forceReconnect} />
      )}

      {/* Session Status Messages */}
      {isSessionEnded && (
        <div className="bg-warning/10 border-b border-warning/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-warning text-sm">This chat session has ended.</p>
            <Button size="sm" onClick={handleStartNewChat} className="bg-warning hover:bg-warning/90 text-warning-foreground">
              Start New Chat
            </Button>
          </div>
        </div>
      )}

      {isWaitingAndStale && (
        <div className="bg-warning/10 border-b border-warning/20 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning text-sm font-medium">Session waiting too long</p>
              <p className="text-warning/70 text-xs">Started {getSessionAge()}</p>
            </div>
            <Button size="sm" onClick={handleStartNewChat} className="bg-warning hover:bg-warning/90 text-warning-foreground">
              Start Fresh
            </Button>
          </div>
        </div>
      )}

      {session && session.status === 'waiting' && !isWaitingAndStale && (
        <div className="bg-primary/10 border-b border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-fjalla font-bold">WAITING FOR SPECIALIST...</p>
              <p className="text-muted-foreground text-xs">Started {getSessionAge()}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartNewChat}
              className="border-primary text-gray-950 bg-yellow-400 hover:bg-yellow-300"
            >
              Start Fresh Instead
            </Button>
          </div>
        </div>
      )}

      {/* Phone Call Handler */}
      {session && session.status === 'active' && (
        <div className="px-4">
          <PhoneCallHandler sessionId={session.id} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id}>
              <ChatMessageItem message={msg} isOwnMessage={msg.sender_type === 'user'} />
              
              {/* Appointment proposal handler */}
              {msg.message_type === 'system' && 
               (msg.metadata?.action_type === 'appointment_proposal' || 
                msg.metadata?.action_type === 'recurring_appointment_proposal') && (
                <div className="w-full mt-2">
                  <AppointmentProposalHandler
                    message={msg}
                    isUser={msg.sender_type === 'user'}
                    onResponse={() => {}}
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {session && !loading && !isSessionEnded ? (
              <p className="font-source">Chat session started. Send a message to begin.</p>
            ) : !session && !loading ? (
              <p className="font-source">Initializing chat...</p>
            ) : loading ? (
              <p className="font-source">Loading chat...</p>
            ) : isSessionEnded ? (
              <p className="font-source">Session ended. Click "Start New Chat" to begin again.</p>
            ) : null}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {session && !isSessionEnded && (
        <QuickActions onAction={handleQuickAction} disabled={loading} />
      )}

      {/* Message Input */}
      <ChatInput
        value={message}
        onChange={setMessage}
        onSend={handleSendMessage}
        disabled={!session || loading || isSessionEnded}
        placeholder={
          session && !isSessionEnded
            ? "Type your message..."
            : isSessionEnded
            ? "Start a new chat to send messages"
            : "Starting chat session..."
        }
        loading={loading}
      />
    </div>
  );
};

export default PeerChat;
