import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, HeartHandshake } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'specialist';
  timestamp: Date;
}

interface DemoUserChatProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const DemoUserChat = ({ isVisible, onClose }: DemoUserChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi there! I'm Sarah, your peer specialist. I'm here to support you through your recovery journey. How are you feeling today?",
      sender: 'specialist',
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const specialistResponses = [
    "That's completely understandable. Many people feel that way early in their recovery. What specific situations are making you feel most anxious?",
    "I appreciate you sharing that with me. It takes courage to be honest about these feelings. Have you tried any of the breathing exercises in your toolbox?",
    "You're taking an important step by reaching out. That shows real strength. Let's work through this together - what would feel most helpful right now?",
    "I hear you, and what you're experiencing is very common. Recovery isn't linear, and it's okay to have difficult days. What has helped you feel grounded in the past?",
    "Thank you for trusting me with this. Remember, you're not alone in this journey. Would it help to talk about some coping strategies we can use together?"
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate specialist response
    setTimeout(() => {
      const randomResponse = specialistResponses[Math.floor(Math.random() * specialistResponses.length)];
      const specialistMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: 'specialist',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, specialistMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto bg-background border shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <HeartHandshake className="text-primary" size={20} />
            </div>
            <div>
              <div className="text-lg font-semibold">Sarah M.</div>
              <div className="text-sm text-muted-foreground font-normal">Peer Specialist • Online</div>
            </div>
          </CardTitle>
          <Badge className="bg-green-500">DEMO</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                    {message.sender === 'user' ? <User size={16} /> : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 opacity-70 ${message.sender === 'user' ? 'text-right' : ''}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-muted">S</AvatarFallback>
                </Avatar>
                <div className="bg-muted text-muted-foreground rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Try: 'I'm feeling overwhelmed today')"
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              size="icon"
            >
              <Send size={16} />
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            💡 This is a demonstration. In the real app, you'll be connected with trained peer specialists.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoUserChat;