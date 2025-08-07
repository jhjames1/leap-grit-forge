import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { ArrowRight, Send, Users, Shield, User, ArrowLeft, Wifi, Plus, Phone } from 'lucide-react';

interface PeerChatModuleProps {
  onComplete: () => void;
}

const PeerChatModule = ({ onComplete }: PeerChatModuleProps) => {
  const [message, setMessage] = useState('');
  const [simulatedMessages, setSimulatedMessages] = useState([
    {
      id: 1,
      content: "I'm feeling really anxious today. Work stress is getting to me and I'm worried about how I'm handling it.",
      sender_type: 'user',
      created_at: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
    },
    {
      id: 2,
      content: "I hear you. Workplace stress can definitely trigger those feelings. It sounds like you're being really mindful by recognizing what's happening. That awareness is actually a huge strength. Can you tell me more about what's specifically feeling overwhelming right now?",
      sender_type: 'specialist',
      created_at: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    },
    {
      id: 3,
      content: "It's the constant deadlines and pressure to perform. I used to cope with drinking, but now I need to find healthier ways. Sometimes I feel like I'm barely keeping it together.",
      sender_type: 'user',
      created_at: new Date(Date.now() - 60000).toISOString() // 1 minute ago
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: simulatedMessages.length + 1,
      content: message,
      sender_type: 'user' as const,
      created_at: new Date().toISOString()
    };
    
    setSimulatedMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // Simulate specialist response after a delay
    setTimeout(() => {
      const responses = [
        "Thank you for sharing that with me. It takes courage to open up about these struggles.",
        "I'm hearing that you're dealing with a lot of pressure right now. Let's work through this together.",
        "That's a really insightful observation. What strategies have you tried so far?",
        "I can sense how difficult this is for you. Remember that seeking support is a sign of strength."
      ];
      
      const response = {
        id: simulatedMessages.length + 2,
        content: responses[Math.floor(Math.random() * responses.length)],
        sender_type: 'specialist' as const,
        created_at: new Date().toISOString()
      };
      
      setSimulatedMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleQuickAction = (actionType: string) => {
    const quickActions = {
      'need-support': "I need support right now. Could you please help me?",
      'feeling-triggered': "I'm feeling triggered and could use some guidance on managing this.",
      'good-day': "Having a good day today! Feeling positive about my recovery journey.",
      'question': "I have a question and would appreciate your guidance."
    };
    
    const messageText = quickActions[actionType as keyof typeof quickActions];
    if (messageText) {
      const newMessage = {
        id: simulatedMessages.length + 1,
        content: messageText,
        sender_type: 'user' as const,
        created_at: new Date().toISOString()
      };
      setSimulatedMessages(prev => [...prev, newMessage]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <Card className="w-full max-w-5xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Training Module Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Peer Chat Interface</h1>
              <p className="text-muted-foreground">
                Experience the real LEAP app peer support system
              </p>
            </div>

            {/* Simulated LEAP Chat Interface */}
            <div className="bg-background rounded-lg border-2 border-dashed border-primary/30 overflow-hidden">
              {/* Chat Header - exactly like real app */}
              <div className="bg-card border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <ArrowLeft size={20} />
                    </Button>
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="text-muted-foreground" size={16} />
                    </div>
                    <div>
                      <h2 className="font-fjalla font-bold text-foreground">Sarah Johnson</h2>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-muted-foreground text-sm">Available Now</p>
                        <Wifi size={12} className="text-green-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-primary text-gray-950 bg-yellow-400 hover:bg-yellow-300">
                      <Plus size={16} className="mr-1" />
                      New Chat
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security Notice - exactly like real app */}
              <div className="bg-muted/50 border-b border-border p-3">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Shield size={16} />
                  <span className="text-sm font-fjalla font-bold">SECURE & CONFIDENTIAL CHAT</span>
                </div>
              </div>

              {/* Connection Status - exactly like real app */}
              <div className="bg-green-500/10 border-b border-green-500/20 p-3">
                <p className="text-green-600 text-sm text-center">
                  ✅ Real-time connected - Messages appear instantly
                </p>
              </div>

              {/* Session Status - exactly like real app */}
              <div className="bg-primary/10 border-b border-primary/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-fjalla font-bold">ACTIVE CHAT SESSION</p>
                    <p className="text-muted-foreground text-xs">Started 5 minutes ago</p>
                  </div>
                </div>
              </div>

              {/* Phone Call Handler - exactly like real app */}
              <div className="px-4 py-2 bg-card border-b">
                <div className="flex items-center justify-between p-3 bg-construction/10 border border-construction/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="text-construction" size={18} />
                    <div>
                      <p className="text-construction font-oswald font-semibold text-sm">Request Phone Call</p>
                      <p className="text-steel-light text-xs">Talk directly with your peer specialist</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-construction hover:bg-construction/90 text-white">
                    Request Call
                  </Button>
                </div>
              </div>

              {/* Messages - exactly like real app */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-background">
                {simulatedMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${
                    msg.sender_type === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div className={`max-w-[80%] ${
                      msg.sender_type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card border border-border text-card-foreground'
                    } rounded-2xl p-4`}>
                      <p className="text-sm leading-relaxed mb-1">{msg.content}</p>
                      <p className={`text-xs ${
                        msg.sender_type === 'user' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions - exactly like real app */}
              <div className="px-4 py-2 bg-background border-t">
                <div className="flex space-x-2 overflow-x-auto">
                  <Button 
                    size="sm" 
                    onClick={() => handleQuickAction('need-support')} 
                    className="font-fjalla whitespace-nowrap font-light text-zinc-50 bg-zinc-600 hover:bg-zinc-500"
                  >
                    NEED SUPPORT
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleQuickAction('feeling-triggered')} 
                    className="bg-secondary text-secondary-foreground font-fjalla whitespace-nowrap hover:bg-secondary/90 font-light"
                  >
                    FEELING TRIGGERED
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleQuickAction('good-day')} 
                    className="font-fjalla whitespace-nowrap font-light bg-zinc-600 hover:bg-zinc-500 text-zinc-50"
                  >
                    GOOD DAY TODAY
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleQuickAction('question')} 
                    className="bg-secondary text-secondary-foreground font-fjalla whitespace-nowrap hover:bg-secondary/90 font-light"
                  >
                    QUESTION
                  </Button>
                </div>
              </div>

              {/* Message Input - exactly like real app */}
              <div className="bg-card border-t border-border p-4">
                <div className="flex space-x-3">
                  <Input 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Type your message..." 
                    className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="font-fjalla bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Training Notes */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Real-Time Features</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The chat includes real-time connection status, session management, and instant message delivery for seamless communication.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Quick Actions</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Users can quickly express common needs with preset buttons, making it easier to communicate during difficult moments.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Security & Privacy</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  All conversations are encrypted and confidential, with clear security indicators to ensure user trust.
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <h4 className="font-semiblist text-orange-800 dark:text-orange-200 mb-2">Professional Support</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Users connect with trained peer specialists who provide professional, empathetic support based on lived experience.
                </p>
              </div>
            </div>

            {/* Interactive Demo Note */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-center">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Try It:</strong> Type a message in the chat above to see how the interface responds!
              </p>
            </div>

            {/* Complete Module Button */}
            <div className="flex justify-center pt-6">
              <Button onClick={onComplete} size="lg" className="px-8">
                Complete Peer Chat Training
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeerChatModule;