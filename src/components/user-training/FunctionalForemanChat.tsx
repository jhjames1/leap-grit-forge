import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'foreman';
  timestamp: Date;
}

interface FunctionalForemanChatProps {
  onMessageSent?: (message: string) => void;
}

const FunctionalForemanChat = ({ onMessageSent }: FunctionalForemanChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hey there! I'm The Foreman, your 24/7 recovery companion. I'm here to support you through any challenges you're facing. How are you feeling today?",
      sender: 'foreman',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Simulate connection status
    const timer = setTimeout(() => {
      setIsConnected(true);
      toast({
        title: "Foreman Connected",
        description: "Ready for conversation",
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [toast]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    onMessageSent?.(content);

    try {
      const { data, error } = await supabase.functions.invoke('foreman-chat', {
        body: {
          message: content,
          context: 'training_session',
          user_id: user?.id,
          conversation_history: messages.slice(-5).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }
      });

      if (error) {
        console.error('Foreman chat error:', error);
        throw new Error('Failed to get response from Foreman');
      }

      const foremanResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help. Could you tell me more about what you're experiencing?",
        sender: 'foreman',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, foremanResponse]);

      // Text-to-speech if enabled
      if (audioEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(foremanResponse.content);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Connection Error",
        description: "Failed to send message. Using training mode response.",
        variant: "destructive",
      });

      // Fallback training responses
      const trainingResponses = [
        "I understand this is challenging. In recovery, it's important to remember that every day is a new opportunity to make positive choices.",
        "Thank you for sharing that with me. What coping strategies have you found most helpful in similar situations?",
        "That takes courage to acknowledge. Recovery is a journey, and having difficult moments doesn't mean you're failing.",
        "I hear you. When you're feeling overwhelmed, sometimes taking a step back and using breathing exercises can help center you.",
        "Your awareness of these feelings is actually a strength. What support do you need right now?"
      ];

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: trainingResponses[Math.floor(Math.random() * trainingResponses.length)],
        sender: 'foreman',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = (response: string) => {
    sendMessage(response);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      toast({
        title: "Audio Enabled",
        description: "Foreman responses will be spoken aloud",
      });
    }
  };

  const toggleListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      if (!isListening) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          toast({
            title: "Listening...",
            description: "Speak your message to the Foreman",
          });
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: "Please try typing your message instead",
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } else {
      toast({
        title: "Speech Recognition Not Available",
        description: "Please type your message instead",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-fjalla font-bold text-lg">THE FOREMAN</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </p>
                <Badge variant="secondary" className="text-xs">Training Mode</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAudio}
              className="p-2"
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Foreman is thinking...</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Response Buttons */}
      <div className="px-4 py-2 border-t border-b">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickResponse("I'm feeling anxious today")}
            disabled={isLoading}
            className="text-xs"
          >
            Feeling Anxious
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickResponse("I need motivation to stay strong")}
            disabled={isLoading}
            className="text-xs"
          >
            Need Motivation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickResponse("Having a good day today")}
            disabled={isLoading}
            className="text-xs"
          >
            Good Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickResponse("Can you help me with coping strategies?")}
            disabled={isLoading}
            className="text-xs"
          >
            Coping Help
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-2 ${isListening ? 'bg-red-500 text-white' : ''}`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Talk to the Foreman..."
            disabled={isLoading || !isConnected}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputMessage);
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading || !isConnected}
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FunctionalForemanChat;