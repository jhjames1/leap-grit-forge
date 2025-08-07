import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Coffee, Heart, BookOpen, Zap, Play, CheckCircle } from 'lucide-react';

interface DailyPromptsModuleProps {
  onComplete: () => void;
}

const DailyPromptsModule = ({ onComplete }: DailyPromptsModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [moodRating, setMoodRating] = useState([7]);
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');

  const steps = [
    {
      title: "Morning Check-In",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Coffee className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Good Morning!</h2>
            <p className="text-lg text-muted-foreground">
              Let's start your day with a gentle check-in
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto p-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  How are you feeling today? (1 = Very Low, 10 = Amazing)
                </label>
                <div className="px-3">
                  <Slider
                    value={moodRating}
                    onValueChange={setMoodRating}
                    max={10}
                    min={1}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very Low</span>
                    <span className="font-medium text-primary">Your mood: {moodRating[0]}/10</span>
                    <span>Amazing</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="reflection" className="text-sm font-medium mb-2 block">
                  What's one thing you're looking forward to today?
                </label>
                <Textarea
                  id="reflection"
                  placeholder="Even something small counts..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              {reflection && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg"
                >
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✨ That's wonderful! Having something to look forward to can brighten your entire day.
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> Morning check-ins help users start their day mindfully and track their emotional patterns over time.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Interactive Exercise",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Breathing Exercise</h2>
            <p className="text-lg text-muted-foreground">
              Take a moment to center yourself
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="space-y-6">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center"
                >
                  <Heart className="h-12 w-12 text-white" />
                </motion.div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">4-7-8 Breathing</h3>
                <div className="text-muted-foreground space-y-2">
                  <p>• Breathe in for 4 counts</p>
                  <p>• Hold for 7 counts</p>
                  <p>• Breathe out for 8 counts</p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center"
                >
                  <p className="text-lg font-medium text-primary mb-4">
                    Follow the circle as it expands and contracts
                  </p>
                  <Badge variant="secondary">3 cycles recommended</Badge>
                </motion.div>
              </div>
              
              <Button size="lg" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Guided Session
              </Button>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> Interactive exercises like breathing help users develop coping skills they can use anytime.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Evening Reflection",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Daily Reflection</h2>
            <p className="text-lg text-muted-foreground">
              End your day with gratitude and reflection
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="gratitude" className="text-sm font-medium mb-2 block">
                  What are three things you're grateful for today?
                </label>
                <Textarea
                  id="gratitude"
                  placeholder="1. My morning coffee was perfect&#10;2. A friend texted to check on me&#10;3. I made it through a challenging day"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Energy Level</h4>
                  <p className="text-xs text-muted-foreground mt-1">How did you feel today?</p>
                </Card>
                
                <Card className="p-4 text-center">
                  <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Self-Care</h4>
                  <p className="text-xs text-muted-foreground mt-1">Did you take care of yourself?</p>
                </Card>
                
                <Card className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Recovery Goals</h4>
                  <p className="text-xs text-muted-foreground mt-1">Made progress today?</p>
                </Card>
              </div>
              
              {gratitude && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg"
                >
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Your Gratitude Practice
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Practicing gratitude has been shown to improve mood, increase resilience, and strengthen recovery. You're building a powerful habit!
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> Evening reflections help users process their day and reinforce positive patterns in their recovery.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Content Variety",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Rich Content Experience</h2>
            <p className="text-lg text-muted-foreground">
              Users receive varied, engaging content daily
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Educational Content</h4>
                  <p className="text-xs text-muted-foreground">Learn about recovery</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">Understanding Triggers</div>
                <div className="p-2 bg-muted rounded">Building Healthy Habits</div>
                <div className="p-2 bg-muted rounded">Stress Management</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Wellness Activities</h4>
                  <p className="text-xs text-muted-foreground">Interactive exercises</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">Meditation Sessions</div>
                <div className="p-2 bg-muted rounded">Gratitude Journaling</div>
                <div className="p-2 bg-muted rounded">Goal Setting</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Motivational Content</h4>
                  <p className="text-xs text-muted-foreground">Inspiration & encouragement</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">Success Stories</div>
                <div className="p-2 bg-muted rounded">Daily Affirmations</div>
                <div className="p-2 bg-muted rounded">Recovery Quotes</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Coffee className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Life Skills</h4>
                  <p className="text-xs text-muted-foreground">Practical guidance</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">Budgeting Tips</div>
                <div className="p-2 bg-muted rounded">Job Interview Prep</div>
                <div className="p-2 bg-muted rounded">Relationship Building</div>
              </div>
            </Card>
          </div>
          
          <Card className="p-6 bg-primary/10">
            <h4 className="font-semibold mb-3">Content Personalization</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Content adapts based on user engagement, progress, and preferences. Users who struggle with mornings might get gentler check-ins, while those who love education get more learning content.
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary">Mood-aware</Badge>
              <Badge variant="secondary">Progress-based</Badge>
              <Badge variant="secondary">Interest-driven</Badge>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> Variety keeps users engaged while meeting different learning styles and recovery needs.
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

export default DailyPromptsModule;