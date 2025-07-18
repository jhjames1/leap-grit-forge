
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
  Clock
} from 'lucide-react';
import { useChatSession } from '@/hooks/useChatSession';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const {
    messages,
    loading,
    error,
    connectionStatus,
    sendMessage,
    endSession
  } = useChatSession(session.specialist_id);

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
    await endSession('completed_by_specialist');
    onClose();
  };

  const handleSchedulerSuccess = () => {
    setShowScheduler(false);
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
              <h3 className="font-semibold">Chat Session</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${
                  session.status === 'active' ? 'bg-green-500' : 
                  session.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <span className="capitalize">{session.status}</span>
                <span>•</span>
                <span>Started {format(new Date(session.started_at), 'HH:mm')}</span>
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
                  onResponse={() => console.log('Appointment proposal response handled')}
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
