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
      title: "LEAP Splash Screen",
      content: (
        <div className="space-y-6">
          <div className="relative bg-cover bg-center h-64 rounded-lg overflow-hidden"
               style={{
                 backgroundImage: `linear-gradient(rgba(11, 20, 38, 0.4), rgba(11, 20, 38, 0.6)), url('/lovable-uploads/c61510da-8bef-4d57-8fba-f87d453bd59e.png')`
               }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h1 className="text-4xl font-bold mb-2">
                <span className="font-fjalla font-extrabold italic">LEAP</span>
              </h1>
              <p className="text-sm font-oswald font-extralight tracking-wide mb-4">
                Don't Tough It Out. Talk It Out.
              </p>
              <div className="w-12 h-12 mb-2">
                <div className="w-full h-full bg-white/20 rounded-full animate-spin flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
              </div>
              <p className="text-xs font-oswald tracking-wide">
                Loading your tools...
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Training Note:</strong> The splash screen features a background image with LEAP branding and a spinning loading animation. This creates an engaging first impression.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Authentication Screen",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Welcome to LEAP</h2>
            <p className="text-muted-foreground">
              Join your recovery journey with peer support
            </p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              {/* Tabs simulation */}
              <div className="flex bg-muted rounded-lg p-1 mb-6">
                <div className="flex-1 text-center py-2 bg-background rounded-md text-sm font-medium">
                  Sign In
                </div>
                <div className="flex-1 text-center py-2 text-sm text-muted-foreground">
                  Sign Up
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Email</label>
                  <div className="p-3 border rounded-md bg-background text-muted-foreground">
                    Enter your email
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Password</label>
                  <div className="p-3 border rounded-md bg-background text-muted-foreground">
                    Enter your password
                  </div>
                </div>
                <Button className="w-full">
                  Sign In
                </Button>
                <div className="text-center">
                  <button className="text-sm text-primary hover:underline">
                    Forgot your password?
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Want to see LEAP in action?
            </p>
            <Button variant="outline" className="flex items-center gap-2 mx-auto">
              Try Interactive Demo
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> The real auth screen has tabs for Sign In/Sign Up, includes a first name field for signup, and offers a demo option for exploring the app.
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