import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock, Users, BarChart3, MessageSquare, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeModuleProps {
  onComplete: () => void;
}

const WelcomeModule: React.FC<WelcomeModuleProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const steps = [
    {
      title: "Welcome to LEAP Admin Training! 👋",
      content: (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Users className="h-12 w-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-4">Get ready to become a LEAP Admin!</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            This interactive training will teach you everything you need to know about managing 
            the LEAP recovery support platform. You'll learn through hands-on demos and practice scenarios.
          </p>
        </div>
      )
    },
    {
      title: "What is the LEAP Admin Portal?",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">Your Command Center for Recovery Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Users, title: "User Management", desc: "Add users, assign peer specialists, track progress" },
              { icon: Calendar, title: "Content Scheduling", desc: "Schedule daily prompts, exercises, and motivational content" },
              { icon: MessageSquare, title: "Chat Monitoring", desc: "Oversee peer conversations and escalate when needed" },
              { icon: BarChart3, title: "Analytics & Reports", desc: "Monitor engagement, track outcomes, identify trends" },
              { icon: Shield, title: "Safety & Compliance", desc: "Maintain HIPAA compliance and user safety protocols" },
              { icon: Clock, title: "Real-time Support", desc: "Respond to urgent situations and provide timely assistance" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Training Overview",
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">What You'll Learn Today</h2>
          <div className="grid gap-6">
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Clock className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">10-15</span>
                <span className="text-xl text-muted-foreground">minutes</span>
              </div>
              <p className="text-muted-foreground">
                Complete training time including interactive modules and quiz
              </p>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <h3 className="font-semibold mb-3 text-primary">6 Interactive Modules</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Dashboard navigation</li>
                  <li>• User & peer management</li>
                  <li>• Content scheduling</li>
                  <li>• Chat monitoring & escalation</li>
                  <li>• Reports & analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-primary">Hands-On Practice</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Clickable demos</li>
                  <li>• Realistic scenarios</li>
                  <li>• Step-by-step guidance</li>
                  <li>• Knowledge quiz</li>
                  <li>• Certification badge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Begin?",
      content: (
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4">Let's Get Started! 🚀</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Remember: This is a safe practice environment. Feel free to click around and explore - 
              you can't break anything here!
            </p>
            
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-green-700 dark:text-green-300">Pro Tip</span>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Look for helpful coaching popups throughout the training - they'll guide you 
                just like having a mentor by your side!
              </p>
            </Card>
          </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 shadow-lg">
            <CardContent className="p-0">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <div className="flex gap-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index <= currentStep ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-6">{steps[currentStep].title}</h1>
              </div>

              {steps[currentStep].content}

              <div className="flex justify-between mt-12">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button onClick={nextStep}>
                  {currentStep === steps.length - 1 ? 'Complete Module' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeModule;