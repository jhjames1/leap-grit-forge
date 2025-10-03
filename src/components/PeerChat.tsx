import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Calendar, ArrowLeft, User, Shield, RefreshCw, Plus, Clock, AlertTriangle, RotateCcw, Wifi, WifiOff, Phone } from 'lucide-react';
import PeerSelection from './PeerSelection';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import SessionInactivityWarning from './SessionInactivityWarning';
import PhoneCallHandler from './PhoneCallHandler';
import { PeerSpecialist } from '@/hooks/usePeerSpecialists';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSpecialistStatus } from '@/hooks/useRealtimeSpecialistStatus';
import { useConnectionHeartbeat } from '@/hooks/useConnectionHeartbeat';
import { sessionCleanup } from '@/utils/sessionCleanup';
interface PeerChatProps {
  onBack?: () => void;
}
const PeerChat = ({
  onBack
}: PeerChatProps) => {
  const [currentView, setCurrentView] = useState<'selection' | 'chat'>('selection');
  const [selectedPeer, setSelectedPeer] = useState<PeerSpecialist | null>(null);
  const [message, setMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [inactivityWarning, setInactivityWarning] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const {
    user
  } = useAuth();
  
  // Get real-time status for selected specialist
  const { getStatusDisplay } = useRealtimeSpecialistStatus(selectedPeer?.id);
  
  // Connection monitoring with automatic reconnection
  const { connectionState, forceReconnect: forceHeartbeatReconnect, isHealthy } = useConnectionHeartbeat({
    heartbeatInterval: 15000, // Check every 15 seconds for chat
    maxReconnectAttempts: 15,
    onConnectionChange: (state) => {
      console.log('🫀 PEER CLIENT: Connection state changed:', state);
      if (!state.isSupabaseConnected && state.reconnectAttempts > 3) {
        console.log('🔄 PEER CLIENT: Multiple reconnect attempts, triggering session refresh');
        // Trigger enhanced reconnection that refreshes session data
        forceChatReconnect();
      }
    }
  });
  
  const {
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
    forceReconnect: forceChatReconnect,
    isSessionStale
  } = useChatSession(selectedPeer?.id);
  const handleSelectPeer = async (peer: PeerSpecialist) => {
    console.log('🎯 Peer selected:', peer);
    setSelectedPeer(peer);
    setCurrentView('chat');
    setIsInitialized(false);
  };

  // Initialize session when peer is selected
  useEffect(() => {
    if (currentView === 'chat' && selectedPeer && !session && !isInitialized && !loading) {
      console.log('🚀 Initializing chat session...');
      setIsInitialized(true);
      startSession();
    }
  }, [currentView, selectedPeer, session, isInitialized, loading, startSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Monitor session inactivity
  useEffect(() => {
    if (!session || session.status !== 'active' || !session.last_activity) {
      setInactivityWarning(0);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }
    const checkInactivity = () => {
      const timeUntilInactive = sessionCleanup.getTimeUntilInactive(session);

      // Show warning when less than 60 seconds remain
      if (timeUntilInactive <= 60 && timeUntilInactive > 0) {
        setInactivityWarning(timeUntilInactive);
      } else if (timeUntilInactive <= 0) {
        // Session should be ended
        endSession('inactivity_timeout');
        setInactivityWarning(0);
      } else {
        setInactivityWarning(0);
      }
    };

    // Check immediately and then every second
    checkInactivity();
    const interval = setInterval(checkInactivity, 1000);
    return () => {
      clearInterval(interval);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [session, endSession]);
  const handleSendMessage = async () => {
    if (!message.trim()) {
      console.log('💬 Empty message, not sending');
      return;
    }
    console.log('📤 Sending message:', message);
    console.log('📋 Current session:', session?.id);
    console.log('📊 Messages before send:', messages.length);
    await sendMessage({
      content: message,
      sender_type: 'user'
    });
    setMessage('');

    // Reset inactivity warning when user sends message
    setInactivityWarning(0);
    console.log('✅ Message sent, clearing input');
  };
  const handleExtendSession = () => {
    // Send a keep-alive message to reset inactivity timer
    if (session) {
      sendMessage({
        content: 'Session extended by user',
        sender_type: 'user',
        message_type: 'system'
      });
      setInactivityWarning(0);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleQuickAction = async (actionType: string) => {
    const actionMessages = {
      'need-support': "I need support right now. Could you please help me?",
      'feeling-triggered': "I'm feeling triggered and could use some guidance on managing this.",
      'good-day': "Having a good day today! Feeling positive about my recovery journey.",
      'question': "I have a question and would appreciate your guidance."
    };
    const messageText = actionMessages[actionType as keyof typeof actionMessages];
    if (messageText) {
      await sendMessage({
        content: messageText,
        sender_type: 'user',
        message_type: 'quick_action',
        metadata: {
          action_type: actionType
        }
      });

      // Reset inactivity warning when user takes action
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
  if (currentView === 'selection') {
    return <PeerSelection onBack={onBack || (() => {})} onSelectPeer={handleSelectPeer} />;
  }
  const isSessionEnded = session && session.status === 'ended';
  const isWaitingAndStale = session && session.status === 'waiting' && isSessionStale;
  const realtimeConnected = connectionStatus === 'connected' && isHealthy;
  const hasFailedMessages = false; // Simplified - no complex optimistic handling
  const showConnectionWarning = !isHealthy || !realtimeConnected;

  // Combined force reconnect function
  const handleForceReconnect = async () => {
    console.log('🔄 PEER CLIENT: Combined force reconnect triggered');
    try {
      await forceHeartbeatReconnect();
      await forceChatReconnect();
    } catch (error) {
      console.error('🔄 PEER CLIENT: Reconnect failed:', error);
    }
  };

  return <div className="flex flex-col h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView('selection')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </Button>
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="text-muted-foreground" size={16} />
            </div>
            <div>
              <h2 className="font-fjalla font-bold text-foreground">{selectedPeer?.first_name} {selectedPeer?.last_name}</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusDisplay().colorClass}`}></div>
                <p className="text-muted-foreground text-sm">
                  {getStatusDisplay().displayText}
                </p>
                {/* Realtime connection indicator */}
                {realtimeConnected ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={handleStartNewChat} className="border-primary text-gray-950 bg-yellow-400 hover:bg-yellow-300">
              <Plus size={16} className="mr-1" />
              New Chat
            </Button>
          </div>
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
      {inactivityWarning > 0 && <div className="p-4">
          <SessionInactivityWarning secondsRemaining={inactivityWarning} onExtendSession={handleExtendSession} onEndSession={() => endSession('manual')} />
        </div>}

      {/* Connection Status Indicators */}
      {loading && <div className="bg-blue-500/10 border-b border-blue-500/20 p-3">
          <p className="text-blue-600 text-sm text-center">Connecting to chat...</p>
        </div>}

      {error && <div className="bg-red-500/10 border-b border-red-500/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-red-600 text-sm">Error: {error}</p>
            <Button size="sm" variant="outline" onClick={refreshSession} className="border-red-500 text-red-600 hover:bg-red-50">
              <RefreshCw size={14} className="mr-1" />
              Retry
            </Button>
          </div>
        </div>}

      {/* Real-time Connection Status */}
      {session && !isSessionEnded && <div className={`border-b p-3 ${realtimeConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className={`text-sm ${realtimeConnected ? 'text-green-600' : 'text-orange-600'}`}>
                {realtimeConnected ? <>✅ Real-time connected - Messages appear instantly</> : <>⚠️ Connection issues - Messages may be delayed</>}
              </p>
              {!isHealthy && (
                <p className="text-xs text-orange-500">
                  Heartbeat: {connectionState.lastHeartbeat ? 
                    `Last: ${connectionState.lastHeartbeat.toLocaleTimeString()}` : 
                    'Never'} | 
                  Attempts: {connectionState.reconnectAttempts}
                  {connectionState.autoReconnecting && ' | Reconnecting...'}
                </p>
              )}
            </div>
            {showConnectionWarning && <Button 
                size="sm" 
                variant="outline" 
                onClick={handleForceReconnect}
                disabled={connectionState.autoReconnecting}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw size={14} className="mr-1" />
                {connectionState.autoReconnecting ? 'Reconnecting...' : 'Reconnect'}
              </Button>}
          </div>
        </div>}

      {/* Session Status Messages */}
      {isSessionEnded && <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-yellow-600 text-sm">This chat session has ended.</p>
            <Button size="sm" onClick={handleStartNewChat} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Start New Chat
            </Button>
          </div>
        </div>}

      {isWaitingAndStale && <div className="bg-orange-500/10 border-b border-orange-500/20 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">This chat session has been waiting too long</p>
              <p className="text-orange-500 text-xs">Started {getSessionAge()} - Consider starting fresh</p>
            </div>
            <Button size="sm" onClick={handleStartNewChat} className="bg-orange-600 hover:bg-orange-700 text-white">
              Start Fresh
            </Button>
          </div>
        </div>}

        {session && session.status === 'waiting' && !isWaitingAndStale && <div className="bg-primary/10 border-b border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-fjalla font-bold">WAITING FOR SPECIALIST...</p>
              <p className="text-muted-foreground text-xs">Started {getSessionAge()}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleStartNewChat} className="border-primary text-gray-950 bg-yellow-400 hover:bg-yellow-300">
              Start Fresh Instead
            </Button>
          </div>
        </div>}

      {/* Phone Call Handler */}
      {session && session.status === 'active' && (
        <div className="px-4">
          <PhoneCallHandler sessionId={session.id} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && <div className="fixed top-20 right-4 bg-black/80 text-white p-2 text-xs z-50 max-w-xs rounded opacity-90">
            <div>Messages: {messages?.length || 0}</div>
            <div>Session: {session?.id ? session.id.slice(0, 8) : 'None'}</div>
            <div>Status: {session?.status || 'None'}</div>
            <div>RT: {realtimeConnected ? 'ON' : 'OFF'}</div>
            <div>Conn: {connectionStatus}</div>
            <div>Health: {isHealthy ? 'GOOD' : 'BAD'}</div>
            <div>Online: {connectionState.isOnline ? 'Y' : 'N'}</div>
            <div>Supabase: {connectionState.isSupabaseConnected ? 'Y' : 'N'}</div>
            <div>Failed: {hasFailedMessages ? 'YES' : 'NO'}</div>
            {session?.last_activity && <div>Inactive: {sessionCleanup.getTimeUntilInactive(session)}s</div>}
          </div>}
        
        {Array.isArray(messages) && messages.length > 0 ? messages.map(msg => <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'user' ? 'items-end' : msg.message_type === 'system' || msg.message_type === 'phone_call_request' ? 'items-center' : 'items-start'}`}>
              {/* Special handling for phone call request messages */}
              {msg.message_type === 'phone_call_request' ? (
                <div className="max-w-[90%] bg-construction/10 border-2 border-construction/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="text-construction" size={18} />
                    <p className="text-construction font-oswald font-semibold">Phone Call Request</p>
                  </div>
                  <p className="text-steel-light text-sm mb-2">{msg.content}</p>
                  <p className="text-xs text-steel-light/70">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ) : (
                <div className={`max-w-[80%] ${msg.sender_type === 'user' ? 'bg-primary text-primary-foreground' : msg.message_type === 'system' ? 'bg-muted/50 text-muted-foreground border border-border' : 'bg-card border border-border text-card-foreground'} rounded-2xl p-4`}>
                  <p className="text-sm leading-relaxed mb-1">{msg.content}</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${msg.sender_type === 'user' ? 'text-primary-foreground/70' : msg.message_type === 'system' ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Appointment proposal handler - only for system messages with proposal metadata */}
              {msg.message_type === 'system' && (msg.metadata?.action_type === 'appointment_proposal' || msg.metadata?.action_type === 'recurring_appointment_proposal') && (
                <div className="w-full mt-2">
                  <AppointmentProposalHandler 
                    message={msg} 
                    isUser={msg.sender_type === 'user'} 
                    onResponse={() => console.log('User responded to appointment proposal')} 
                  />
                </div>
              )}
            </div>) : <div className="text-center text-muted-foreground py-8">
            {session && !loading && !isSessionEnded ? <p className="font-source">Chat session started. Send a message to begin the conversation.</p> : !session && !loading ? <p className="font-source">No chat session active. Initializing...</p> : loading ? <p className="font-source">Loading chat...</p> : isSessionEnded ? <p className="font-source">This chat session has ended. Click "Start New Chat" to begin a new conversation.</p> : null}
          </div>}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {session && !isSessionEnded && <div className="px-4 py-2">
          <div className="flex space-x-2 overflow-x-auto">
            <Button size="sm" onClick={() => handleQuickAction('need-support')} className="font-fjalla whitespace-nowrap font-light text-zinc-50 bg-zinc-600 hover:bg-zinc-500">
              NEED SUPPORT
            </Button>
            <Button size="sm" onClick={() => handleQuickAction('feeling-triggered')} className="bg-secondary text-secondary-foreground font-fjalla whitespace-nowrap hover:bg-secondary/90 font-light">
              FEELING TRIGGERED
            </Button>
            <Button size="sm" onClick={() => handleQuickAction('good-day')} className="font-fjalla whitespace-nowrap font-light bg-zinc-600 hover:bg-zinc-500 text-zinc-50">
              GOOD DAY TODAY
            </Button>
            <Button size="sm" onClick={() => handleQuickAction('question')} className="bg-secondary text-secondary-foreground font-fjalla whitespace-nowrap hover:bg-secondary/90 font-light">
              QUESTION
            </Button>
          </div>
        </div>}

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex space-x-3">
          <Input value={message} onChange={e => setMessage(e.target.value)} placeholder={session && !isSessionEnded ? "Type your message..." : isSessionEnded ? "Start a new chat to send messages" : "Starting chat session..."} className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground" onKeyPress={handleKeyPress} disabled={!session || loading || isSessionEnded} />
          <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6" disabled={!session || loading || !message.trim() || isSessionEnded}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>;
};
export default PeerChat;