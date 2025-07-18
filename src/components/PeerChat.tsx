
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatSession } from '@/hooks/useChatSession';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Clock, User, Bot, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import AppointmentProposalHandler from '@/components/AppointmentProposalHandler';

interface PeerChatProps {
  specialistId: string;
  specialistName: string;
  onBack: () => void;
  onSessionEnded?: () => void;
}

const PeerChat: React.FC<PeerChatProps> = ({ specialistId, specialistName, onBack, onSessionEnded }) => {
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
  } = useChatSession(specialistId);
  
  const [messageInput, setMessageInput] = useState('');
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if session exists on mount
  useEffect(() => {
    if (session) {
      setIsSessionStarted(true);
    }
  }, [session]);

  const handleStartSession = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to start a chat session",
        variant: "destructive"
      });
      return;
    }

    const newSession = await startSession();
    if (newSession) {
      setIsSessionStarted(true);
      toast({
        title: "Session Started",
        description: `Connected with ${specialistName}`
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !session) return;
    
    await sendMessage({
      content: messageInput.trim(),
      message_type: 'text'
    });
    
    setMessageInput('');
  };

  const handleEndSession = async () => {
    if (session) {
      await endSession();
      setIsSessionStarted(false);
      toast({
        title: "Session Ended",
        description: "Chat session has been closed"
      });
      onSessionEnded?.();
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const renderMessage = (message: any) => {
    const isUser = message.sender_type === 'user';
    const isSystem = message.message_type === 'system';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-center gap-1">
              {isSystem ? (
                <Bot className="w-4 h-4" />
              ) : isUser ? (
                <User className="w-4 h-4" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              <span className="text-xs text-muted-foreground">
                {isSystem ? 'System' : isUser ? 'You' : specialistName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
          
          <div className={`p-3 rounded-lg ${
            isSystem 
              ? 'bg-muted border border-border' 
              : isUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
          }`}>
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
          </div>
          
          {/* Show appointment proposal handler for specialist messages */}
          {!isUser && (
            <AppointmentProposalHandler 
              message={message} 
              isUser={isUser}
              onResponse={() => {
                // Refresh or handle response
                console.log('Appointment proposal responded to');
              }}
            />
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Connection Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={onBack}>Go Back</Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Back
            </Button>
            <div>
              <h2 className="font-semibold">{specialistName}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                <span className="text-sm text-muted-foreground capitalize">
                  {connectionStatus}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {session?.status && (
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status}
              </Badge>
            )}
            {session && (
              <Button variant="outline" size="sm" onClick={handleEndSession}>
                End Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isSessionStarted ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Chat Session</h3>
            <p className="text-muted-foreground mb-6">
              Begin a conversation with {specialistName}
            </p>
            <Button onClick={handleStartSession} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {isSessionStarted && (
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              disabled={!session || connectionStatus !== 'connected'}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!messageInput.trim() || !session || connectionStatus !== 'connected'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PeerChat;
