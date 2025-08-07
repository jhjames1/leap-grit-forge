import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Heart, Users, Target, Shield } from 'lucide-react';

interface UserWelcomeModuleProps {
  onComplete: () => void;
}

const UserWelcomeModule = ({ onComplete }: UserWelcomeModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to LEAP",
      content: (
        <div className="text-center space-y-6">
          <div className="mb-8">
            <h2 className="text-5xl font-bold mb-4">
              <span className="font-oswald font-extralight tracking-tight">DAILY</span>
              <span className="font-fjalla font-extrabold italic">LEAP</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              This is how users first see the LEAP app title
            </p>
          </div>
          
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Training Note:</strong> Notice the distinctive typography - "DAILY" in light Oswald font and "LEAP" in bold italic Fjalla font. This branding appears throughout the app.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "App Authentication",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">User Sign In/Sign Up</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Users authenticate through Supabase before accessing any content
            </p>
          </div>
          
          <Card className="p-6 max-w-sm mx-auto">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="mt-1 p-3 border rounded-lg bg-background">
                  user@example.com
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="mt-1 p-3 border rounded-lg bg-background">
                  ••••••••
                </div>
              </div>
              <Button className="w-full bg-primary text-white font-bold py-3 rounded-xl">
                Sign In
              </Button>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> All user data is securely stored and users must authenticate to access their personal recovery journey.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Splash Screen Experience",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">L</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Loading Experience</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Users see a brief splash screen while the app loads their data
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded-full w-1/2 mx-auto"></div>
            </div>
            <p className="text-sm text-muted-foreground">Loading your journey...</p>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> The splash screen creates anticipation while the app loads personalized content and recovery data.
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

export default UserWelcomeModule;