import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Calendar, Target, CheckCircle } from 'lucide-react';

interface OnboardingExperienceModuleProps {
  onComplete: () => void;
}

const OnboardingExperienceModule = ({ onComplete }: OnboardingExperienceModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    goals: '',
    startDate: ''
  });

  const steps = [
    {
      title: "Profile Setup",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <User className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Let's Get to Know You</h2>
            <p className="text-lg text-muted-foreground">
              This information helps us personalize your LEAP experience
            </p>
          </div>
          
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <Label htmlFor="name">What would you like us to call you?</Label>
              <Input
                id="name"
                placeholder="Enter your preferred name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">What's your recovery start date?</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps us track your progress and milestones
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> Users can update this information anytime. The goal is to make them feel seen and supported.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Recovery Goals",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Target className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">What Brings You Here?</h2>
            <p className="text-lg text-muted-foreground">
              Share what you hope to achieve in your recovery journey
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <Label htmlFor="goals">Your recovery goals (optional)</Label>
            <Textarea
              id="goals"
              placeholder="Example: Stay sober, rebuild relationships, find new hobbies..."
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              className="mt-1 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              These goals can evolve as you progress
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="p-4 text-center">
              <h4 className="font-semibold mb-2">Daily Focus</h4>
              <p className="text-sm text-muted-foreground">Small steps each day</p>
            </Card>
            <Card className="p-4 text-center">
              <h4 className="font-semibold mb-2">Peer Support</h4>
              <p className="text-sm text-muted-foreground">Connect with others</p>
            </Card>
            <Card className="p-4 text-center">
              <h4 className="font-semibold mb-2">Personal Growth</h4>
              <p className="text-sm text-muted-foreground">Discover new strengths</p>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> Goals aren't mandatory. Some users need time to figure out what they want.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Your Support Network",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Calendar className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Building Your Support System</h2>
            <p className="text-lg text-muted-foreground">
              Here's how LEAP will support you every day
            </p>
          </div>
          
          <div className="grid gap-4">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Daily Check-ins</h4>
                  <p className="text-sm text-muted-foreground">
                    Gentle prompts to reflect on your day and track progress
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Peer Connections</h4>
                  <p className="text-sm text-muted-foreground">
                    Chat with trained peer specialists and others on similar journeys
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Crisis Support</h4>
                  <p className="text-sm text-muted-foreground">
                    24/7 access to crisis resources and immediate help when needed
                  </p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> Users need to know help is always available, especially during onboarding when anxiety is highest.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-6">
          <div className="mb-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-primary mb-4">Welcome to LEAP!</h2>
            <p className="text-xl text-muted-foreground">
              Your recovery journey starts now
            </p>
          </div>
          
          {formData.name && (
            <Card className="p-6 bg-primary/10">
              <h3 className="text-lg font-semibold mb-4">Your LEAP Profile</h3>
              <div className="text-left space-y-2">
                <p><strong>Name:</strong> {formData.name}</p>
                {formData.startDate && <p><strong>Recovery Start:</strong> {new Date(formData.startDate).toLocaleDateString()}</p>}
                {formData.goals && <p><strong>Goals:</strong> {formData.goals}</p>}
              </div>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button size="lg" className="h-16">
              <Calendar className="h-5 w-5 mr-2" />
              View Your Calendar
            </Button>
            <Button size="lg" variant="outline" className="h-16">
              <User className="h-5 w-5 mr-2" />
              Connect with Peers
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> The onboarding ends with clear next steps and immediate actions users can take.
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
            className="min-h-[500px] flex items-center"
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

export default OnboardingExperienceModule;