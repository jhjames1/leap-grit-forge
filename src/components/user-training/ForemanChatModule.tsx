import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Bot, Send, Heart, Bookmark, MessageCircle, Users } from 'lucide-react';

interface ForemanChatModuleProps {
  onComplete: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'foreman';
  text: string;
  time: string;
}

const ForemanChatModule = ({ onComplete }: ForemanChatModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoMessages, setDemoMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'foreman',
      text: "Hey there! What's bringing you here today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [demoInput, setDemoInput] = useState('');

  const handleDemoSend = () => {
    if (!demoInput.trim()) return;
    
    const userMessage: Message = {
      id: demoMessages.length + 1,
      sender: 'user',
      text: demoInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const foremanResponse: Message = {
      id: demoMessages.length + 2,
      sender: 'foreman',
      text: "I hear you. Let's work through this together. What's your biggest challenge right now?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setDemoMessages([...demoMessages, userMessage, foremanResponse]);
    setDemoInput('');
  };

  const steps = [
    {
      title: "The Foreman Overview",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="bg-yellow-400 p-4 rounded-lg mx-auto mb-4 w-fit">
              <Bot className="text-black" size={32} />
            </div>
            <h2 className="text-xl font-semibold mb-3">Meet The Foreman</h2>
            <p className="text-muted-foreground text-sm">
              LEAP's AI-powered recovery companion available 24/7
            </p>
          </div>
          
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Key Features:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-primary" />
                  Conversational AI trained for recovery support
                </li>
                <li className="flex items-center gap-2">
                  <Heart size={16} className="text-primary" />
                  Personalized responses based on conversation history
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Can escalate to peer specialists when needed
                </li>
                <li className="flex items-center gap-2">
                  <Bookmark size={16} className="text-primary" />
                  Remembers previous conversations and context
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> The Foreman is a sophisticated AI that uses conversation memory, mood detection, and crisis intervention protocols.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Live Foreman Demo",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Interactive Foreman Chat</h2>
            <p className="text-muted-foreground text-sm">
              Try having a conversation with The Foreman
            </p>
          </div>
          
          <Card className="h-64 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {demoMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-xs opacity-70 mt-1">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleDemoSend()}
                  className="flex-1"
                />
                <Button onClick={handleDemoSend} size="sm">
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> This is a simplified demo. The real Foreman uses advanced AI to provide personalized, context-aware responses and can suggest appropriate tools.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Conversation Memory & Context",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Smart Conversation Tracking</h2>
            <p className="text-muted-foreground text-sm">
              How The Foreman remembers and learns from interactions
            </p>
          </div>
          
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Conversation Memory Features:</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h4 className="text-sm font-semibold mb-1">Session Context</h4>
                  <p className="text-xs text-muted-foreground">
                    Tracks mood, topics, and conversation flow within each session
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <h4 className="text-sm font-semibold mb-1">Historical Memory</h4>
                  <p className="text-xs text-muted-foreground">
                    Remembers past conversations, tools used, and user preferences
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <h4 className="text-sm font-semibold mb-1">Personalized Greetings</h4>
                  <p className="text-xs text-muted-foreground">
                    Tailors opening messages based on previous interaction patterns
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <h4 className="text-sm font-semibold mb-1">Crisis Detection</h4>
                  <p className="text-xs text-muted-foreground">
                    Monitors for crisis language and escalates to human support
                  </p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> The Foreman's memory system allows it to provide increasingly personalized support as it learns about each user's journey.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{steps[currentStep].title}</h1>
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px] flex items-center"
          >
            {steps[currentStep].content}
          </motion.div>

          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Complete Module' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForemanChatModule;