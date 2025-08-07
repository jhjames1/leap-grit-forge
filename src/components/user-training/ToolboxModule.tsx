import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Zap, Heart, Brain, Bookmark, Play, Search } from 'lucide-react';

interface ToolboxModuleProps {
  onComplete: () => void;
}

const ToolboxModule = ({ onComplete }: ToolboxModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const steps = [
    {
      title: "Recovery Toolbox",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Your Recovery Toolkit</h2>
            <p className="text-lg text-muted-foreground">
              Instant access to coping strategies and support tools
            </p>
          </div>
          
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools (e.g., anxiety, stress, sleep)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedTool('breathing')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Breathing Exercises</h4>
                  <p className="text-sm text-muted-foreground">Quick anxiety relief</p>
                  <Badge variant="secondary" className="mt-1">5 exercises</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedTool('grounding')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Grounding Techniques</h4>
                  <p className="text-sm text-muted-foreground">Stay present and centered</p>
                  <Badge variant="secondary" className="mt-1">8 techniques</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedTool('wisdom')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Bookmark className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Wisdom Library</h4>
                  <p className="text-sm text-muted-foreground">Inspirational quotes & stories</p>
                  <Badge variant="secondary" className="mt-1">150+ items</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedTool('emergency')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Crisis Tools</h4>
                  <p className="text-sm text-muted-foreground">Emergency coping strategies</p>
                  <Badge variant="destructive" className="mt-1">Always available</Badge>
                </div>
              </div>
            </Card>
          </div>
          
          {selectedTool && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 rounded-lg"
            >
              <p className="text-sm">
                <strong>Selected:</strong> {
                  selectedTool === 'breathing' ? 'Breathing exercises help regulate your nervous system and reduce anxiety in moments of stress.' :
                  selectedTool === 'grounding' ? 'Grounding techniques help you reconnect with the present moment when feeling overwhelmed.' :
                  selectedTool === 'wisdom' ? 'The wisdom library contains carefully curated content to inspire and motivate during difficult times.' :
                  'Crisis tools provide immediate support strategies when you need help right now.'
                }
              </p>
            </motion.div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> The toolbox is designed for immediate access during challenging moments. Users can search by emotion or situation.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Interactive Breathing Exercise",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">5-4-3-2-1 Grounding</h2>
            <p className="text-lg text-muted-foreground">
              A powerful technique to calm anxiety and stay present
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto p-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-40 h-40 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Look Around and Name:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/30">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">👁️ 5 Things You Can See</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Look around and mentally note 5 different objects in your environment
                    </p>
                  </Card>
                  
                  <Card className="p-4 bg-green-50 dark:bg-green-950/30">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✋ 4 Things You Can Touch</h4>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Notice the texture of your clothes, chair, or any nearby object
                    </p>
                  </Card>
                  
                  <Card className="p-4 bg-purple-50 dark:bg-purple-950/30">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">👂 3 Things You Can Hear</h4>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      Listen for sounds around you - traffic, birds, your own breathing
                    </p>
                  </Card>
                  
                  <Card className="p-4 bg-orange-50 dark:bg-orange-950/30">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">👃 2 Things You Can Smell</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      Take a gentle breath and notice any scents in the air
                    </p>
                  </Card>
                </div>
                
                <Card className="p-4 bg-red-50 dark:bg-red-950/30">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">👅 1 Thing You Can Taste</h4>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    Notice the taste in your mouth, or take a sip of water
                  </p>
                </Card>
              </div>
              
              <Button size="lg" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Guided Version
              </Button>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> This technique helps users reconnect with their senses and ground themselves in the present moment during anxiety or panic.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Wisdom Library",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Bookmark className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Wisdom & Inspiration</h2>
            <p className="text-lg text-muted-foreground">
              Curated content to uplift and motivate
            </p>
          </div>
          
          <div className="grid gap-4 max-w-3xl mx-auto">
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary">Daily Quote</Badge>
                <Bookmark className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
              <blockquote className="text-lg italic mb-3">
                "The only way out is through. But you don't have to walk through alone."
              </blockquote>
              <p className="text-sm text-muted-foreground">- Recovery Community Wisdom</p>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary">Success Story</Badge>
                <Bookmark className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Finding Strength in Small Steps</h4>
              <p className="text-sm text-muted-foreground mb-3">
                "I thought recovery meant being perfect every day. But I learned that it's about showing up, even on the hard days. Some days I barely managed to check in with LEAP, but that tiny action kept me connected..."
              </p>
              <Button variant="outline" size="sm">Read Full Story</Button>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary">Coping Strategy</Badge>
                <Bookmark className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
              <h4 className="font-semibold mb-2">The HALT Check</h4>
              <p className="text-sm text-muted-foreground mb-3">
                When you're feeling overwhelmed, pause and check: Am I Hungry? Angry? Lonely? Tired? Addressing these basic needs can prevent bigger challenges.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">H - Hungry</Badge>
                <Badge variant="outline">A - Angry</Badge>
                <Badge variant="outline">L - Lonely</Badge>
                <Badge variant="outline">T - Tired</Badge>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary">Exercise</Badge>
                <Bookmark className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
              <h4 className="font-semibold mb-2">3-Minute Gratitude Reset</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Take 3 minutes to write down three things you're grateful for today. They can be tiny - the warmth of your coffee, a text from a friend, or simply making it through yesterday.
              </p>
              <Button variant="outline" size="sm">Start Exercise</Button>
            </Card>
          </div>
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              <Search className="h-4 w-4 mr-2" />
              Browse Full Library
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg max-w-3xl mx-auto">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> The wisdom library grows based on user feedback and needs. Content is carefully curated by recovery professionals and peer specialists.
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
      <Card className="w-full max-w-5xl">
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

export default ToolboxModule;