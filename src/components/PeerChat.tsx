import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Phone, 
  Video, 
  Calendar, 
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';
import PeerSelection from './PeerSelection';
import RecurringAppointmentScheduler from './RecurringAppointmentScheduler';
import AppointmentProposalHandler from './AppointmentProposalHandler';
import { PeerSpecialist } from '@/hooks/usePeerSpecialists';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuth } from '@/hooks/useAuth';

interface PeerChatProps {
  onBack?: () => void;
}

const PeerChat = ({ onBack }: PeerChatProps) => {
  const [currentView, setCurrentView] = useState<'selection' | 'chat'>('selection');
  const [selectedPeer, setSelectedPeer] = useState<PeerSpecialist | null>(null);
  const [message, setMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const {
    session,
    messages,
    loading,
    error,
    connectionStatus,
    startSession,
    sendMessage,
    endSession
  } = useChatSession(selectedPeer?.id);

  const handleSelectPeer = async (peer: PeerSpecialist) => {
    console.log('Peer selected:', peer);
    setSelectedPeer(peer);
    setCurrentView('chat');
    setIsInitialized(false);
  };

  // Initialize session when peer is selected and view changes to chat
  useEffect(() => {
    if (currentView === 'chat' && selectedPeer && !session && !isInitialized && !loading) {
      console.log('Initializing chat session...');
      setIsInitialized(true);
      startSession();
    }
  }, [currentView, selectedPeer, session, isInitialized, loading, startSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      console.log('💬 Empty message, not sending');
      return;
    }

    console.log('💬 Sending message from PeerChat:', message);
    console.log('💬 Current session:', session);
    console.log('💬 Current messages count before send:', messages.length);
    
    await sendMessage({ 
      content: message,
      sender_type: 'user'
    });
    setMessage('');
    
    console.log('💬 Message sent, clearing input');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePhoneCall = () => {
    if (selectedPeer?.status.status === 'online') {
      window.location.href = 'tel:+14327018678';
    } else {
      alert('This specialist is not available for calls right now.');
    }
  };

  const handleVideoCall = () => {
    if (selectedPeer?.status.status === 'online') {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|iphone|ipad|mobile/.test(userAgent);
      
      if (isMobile) {
        window.location.href = 'msteams://';
        setTimeout(() => {
          window.location.href = 'zoomus://';
        }, 1000);
      } else {
        window.open('https://teams.microsoft.com/start', '_blank');
      }
    } else {
      alert('This specialist is not available for video calls right now.');
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
        message_type: 'quick_action',
        metadata: { action_type: actionType }
      });
    }
  };

  if (currentView === 'selection') {
    return (
      <PeerSelection 
        onBack={onBack || (() => {})} 
        onSelectPeer={handleSelectPeer} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-midnight/90 backdrop-blur-sm border-b border-steel-dark p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('selection')}
              className="text-steel-light hover:text-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="w-10 h-10 bg-steel rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <div>
              <h2 className="font-oswald font-semibold text-white">{selectedPeer?.first_name} {selectedPeer?.last_name}</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${selectedPeer?.status.status === 'online' ? 'bg-green-500' : selectedPeer?.status.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                <p className="text-steel-light text-sm">
                  {selectedPeer?.status.status === 'online' ? 'Online' : selectedPeer?.status.status === 'away' ? 'Away' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              onClick={handlePhoneCall}
              disabled={selectedPeer?.status.status !== 'online'}
            >
              <Phone size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              onClick={handleVideoCall}
              disabled={selectedPeer?.status.status !== 'online'}
            >
              <Video size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-steel/10 border-b border-steel/20 p-3">
        <div className="flex items-center space-x-2 text-steel-light">
          <Shield size={16} />
          <span className="text-sm font-oswald">Secure & Confidential Chat</span>
        </div>
      </div>

      {/* Connection Status */}
      {loading && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3">
          <p className="text-yellow-600 text-sm text-center">Connecting to chat...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-3">
          <p className="text-red-600 text-sm text-center">Error: {error}</p>
        </div>
      )}

      {connectionStatus === 'connected' && session && (
        <div className="bg-green-500/10 border-b border-green-500/20 p-3">
          <p className="text-green-600 text-sm text-center">
            ✓ Real-time chat connected - Messages will appear instantly
          </p>
        </div>
      )}

      {connectionStatus === 'disconnected' && session && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-3">
          <p className="text-orange-600 text-sm text-center">
            ⚠ Connection issue - Messages may be delayed
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50 max-w-sm opacity-80">
            Messages: {messages?.length || 0} | Session: {session?.id ? session.id.slice(0,8) : 'None'} | Loading: {loading ? 'Yes' : 'No'} | Error: {error ? 'Yes' : 'No'}
          </div>
        )}
        
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender_type === 'user' ? 'justify-end' : msg.message_type === 'system' ? 'justify-center' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                msg.sender_type === 'user' 
                  ? 'bg-steel text-white' 
                  : msg.message_type === 'system'
                  ? 'bg-construction/20 text-construction border border-construction/30'
                  : 'bg-white/10 backdrop-blur-sm text-muted-foreground'
               } rounded-2xl p-4`}>
                <p className="text-sm leading-relaxed mb-1">{msg.content}</p>
                <p className={`text-xs ${
                  msg.sender_type === 'user' ? 'text-white/70' : msg.message_type === 'system' ? 'text-construction/70' : 'text-steel-light'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {/* Display appointment proposal handler for both single and recurring proposals */}
              {(msg.metadata?.action_type === 'appointment_proposal' || msg.metadata?.action_type === 'recurring_appointment_proposal') && (
                <AppointmentProposalHandler 
                  message={msg} 
                  isUser={msg.sender_type === 'user'} 
                  onResponse={() => console.log('User responded to appointment proposal')}
                />
              )}
            </div>
          ))
        ) : (
          <>
            {session && !loading && (
              <div className="text-center text-steel-light py-8">
                <p>Chat session started. Send a message to begin the conversation.</p>
              </div>
            )}
            
            {!session && !loading && (
              <div className="text-center text-steel-light py-8">
                <p>No chat session active. Initializing...</p>
              </div>
            )}
            
            {loading && (
              <div className="text-center text-steel-light py-8">
                <p>Loading chat...</p>
              </div>
            )}
          </>
        )}
        
        {/* Invisible div for auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {session && (
        <div className="px-4 py-2">
          <div className="flex space-x-2 overflow-x-auto">
            <Button 
              size="sm"
              onClick={() => handleQuickAction('need-support')}
              className="bg-steel text-white font-oswald whitespace-nowrap hover:bg-steel-light"
            >
              Need Support
            </Button>
            <Button 
              size="sm"
              onClick={() => handleQuickAction('feeling-triggered')}
              className="bg-steel text-white font-oswald whitespace-nowrap hover:bg-steel-light"
            >
              Feeling Triggered
            </Button>
            <Button 
              size="sm"
              onClick={() => handleQuickAction('good-day')}
              className="bg-steel text-white font-oswald whitespace-nowrap hover:bg-steel-light"
            >
              Good Day Today
            </Button>
            <Button 
              size="sm"
              onClick={() => handleQuickAction('question')}
              className="bg-steel text-white font-oswald whitespace-nowrap hover:bg-steel-light"
            >
              Question
            </Button>
          </div>
        </div>
      )}

      {/* Scheduled Check-in Banner */}
      {selectedPeer?.status.status === 'online' && session && user && (
        <div className="bg-steel/90 backdrop-blur-sm border-t border-steel-dark p-3">
          <div className="flex items-center space-x-3">
            <Calendar className="text-white" size={16} />
            <div className="flex-1">
              <p className="text-white font-oswald font-medium text-sm">
                Weekly Check-in Available
              </p>
              <p className="text-white/70 text-xs">
                Schedule with {selectedPeer.first_name} {selectedPeer.last_name}
              </p>
            </div>
            <RecurringAppointmentScheduler 
              specialistId={selectedPeer.id}
              userId={user.id}
              chatSessionId={session.id}
            />
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-midnight/90 backdrop-blur-sm border-t border-steel-dark p-4">
        <div className="flex space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={session ? "Type your message..." : "Starting chat session..."}
            className="flex-1 bg-white/10 border-steel-dark text-white placeholder:text-steel-light"
            onKeyPress={handleKeyPress}
            disabled={!session || loading}
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-steel hover:bg-steel-light text-white px-6"
            disabled={!session || loading || !message.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PeerChat;
