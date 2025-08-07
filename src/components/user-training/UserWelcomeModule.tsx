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
            <h2 className="text-4xl font-bold text-primary mb-4">Welcome to LEAP</h2>
            <p className="text-xl text-muted-foreground">
              Your journey to recovery starts here
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Compassionate Support</h3>
              <p className="text-sm text-muted-foreground">
                Connect with peers who understand your journey
              </p>
            </Card>
            <Card className="p-6">
              <Target className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Personalized Path</h3>
              <p className="text-sm text-muted-foreground">
                Tailored tools and exercises for your recovery
              </p>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>This is what your users see first.</strong> Notice the welcoming tone and clear value proposition.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Your Safe Space",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Your Privacy Matters</h2>
            <p className="text-lg text-muted-foreground mb-6">
              LEAP is a secure, confidential platform designed specifically for recovery support.
            </p>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>End-to-end encryption for all conversations</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>HIPAA-compliant data protection</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Only you control who sees your information</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> Users need to feel safe before they'll engage. This security message builds trust.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Meet Your Community",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Users className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">You're Not Alone</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Connect with trained peer specialists and others on similar journeys.
            </p>
          </div>
          
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  PS
                </div>
                <div>
                  <h4 className="font-semibold">Peer Specialists</h4>
                  <p className="text-sm text-muted-foreground">Trained professionals with lived experience</p>
                </div>
                <Badge variant="secondary" className="ml-auto">Available 24/7</Badge>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                  PC
                </div>
                <div>
                  <h4 className="font-semibold">Peer Community</h4>
                  <p className="text-sm text-muted-foreground">Others walking the recovery path with you</p>
                </div>
                <Badge variant="outline">Join Groups</Badge>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> This is how users understand the support system available to them.
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