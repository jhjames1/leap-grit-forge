import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Send, Users, Shield, Heart, MessageCircle } from 'lucide-react';

interface PeerChatModuleProps {
  onComplete: () => void;
}

const PeerChatModule = ({ onComplete }: PeerChatModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'Sarah (Peer Specialist)',
      message: 'Welcome to the group! How are you feeling today?',
      time: '2:30 PM',
      type: 'specialist'
    },
    {
      id: 2,
      sender: 'Mike',
      message: 'Having a tough day, but I\'m here and that\'s what matters',
      time: '2:32 PM',
      type: 'peer'
    }
  ]);

  const steps = [
    {
      title: "Peer Support Community",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Users className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Connect with Your Community</h2>
            <p className="text-lg text-muted-foreground">
              Peer support is at the heart of recovery
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Safe Space</h4>
              <p className="text-sm text-muted-foreground">
                All conversations are private and moderated by trained specialists
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Mutual Support</h4>
              <p className="text-sm text-muted-foreground">
                Share experiences and learn from others who understand
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">24/7 Access</h4>
              <p className="text-sm text-muted-foreground">
                Connect whenever you need support, day or night
              </p>
            </Card>
          </div>
          
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/30">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Active Support Groups
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded">
                <span className="text-sm">Daily Check-in Group</span>
                <Badge variant="secondary">12 active</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded">
                <span className="text-sm">Mindfulness & Meditation</span>
                <Badge variant="secondary">8 active</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded">
                <span className="text-sm">Family Recovery Support</span>
                <Badge variant="secondary">15 active</Badge>
              </div>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> Users can see there's an active, supportive community waiting for them.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Live Chat Experience",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <MessageCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Real Conversations</h2>
            <p className="text-lg text-muted-foreground">
              This is what peer support looks like in action
            </p>
          </div>
          
          {/* Mock Chat Interface */}
          <Card className="max-w-2xl mx-auto">
            <div className="p-4 border-b bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <Avatar className="border-2 border-white">
                    <AvatarFallback className="bg-blue-500 text-white">S</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-white">
                    <AvatarFallback className="bg-green-500 text-white">M</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-white">
                    <AvatarFallback className="bg-purple-500 text-white">+</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h4 className="font-semibold">Daily Check-in Group</h4>
                  <p className="text-sm text-muted-foreground">5 members online</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 max-h-60 overflow-y-auto space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-white text-xs ${
                      msg.type === 'specialist' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {msg.sender.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.sender}</span>
                      {msg.type === 'specialist' && (
                        <Badge variant="secondary" className="text-xs">Specialist</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm bg-muted p-2 rounded-lg">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && message.trim()) {
                      setChatMessages(prev => [...prev, {
                        id: prev.length + 1,
                        sender: 'You',
                        message: message,
                        time: '2:35 PM',
                        type: 'user'
                      }]);
                      setMessage('');
                    }
                  }}
                />
                <Button size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> Try typing a message to see how easy it is to participate in the conversation.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Support Guidelines",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Creating a Safe Environment</h2>
            <p className="text-lg text-muted-foreground">
              Everyone deserves to feel safe and supported
            </p>
          </div>
          
          <div className="grid gap-4">
            <Card className="p-4 border-l-4 border-l-green-500">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ Do</h4>
              <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                <li>• Share your experiences and feelings</li>
                <li>• Listen without judgment</li>
                <li>• Offer encouragement and hope</li>
                <li>• Respect others' privacy and boundaries</li>
                <li>• Use "I" statements when sharing</li>
              </ul>
            </Card>
            
            <Card className="p-4 border-l-4 border-l-red-500">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">✗ Don't</h4>
              <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
                <li>• Give specific medical or legal advice</li>
                <li>• Share personal contact information</li>
                <li>• Discuss illegal activities</li>
                <li>• Judge or criticize others' choices</li>
                <li>• Share someone else's personal information</li>
              </ul>
            </Card>
          </div>
          
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/30">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              Crisis Support
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              If you're in crisis or having thoughts of self-harm, please reach out immediately:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded">
                <span>Crisis Text Line</span>
                <Badge>Text HOME to 741741</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded">
                <span>National Suicide Prevention</span>
                <Badge>988</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded">
                <span>Emergency Services</span>
                <Badge>911</Badge>
              </div>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> Clear guidelines help users feel safe and know what to expect from the community.
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
            className="min-h-[500px]"
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

export default PeerChatModule;