import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Flame, Target, Trophy, Calendar, Play, TrendingUp, Clock } from 'lucide-react';

interface DashboardHomeModuleProps {
  onComplete: () => void;
}

const DashboardHomeModule = ({ onComplete }: DashboardHomeModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Dashboard Overview",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-5xl font-bold mb-4">
              <span className="font-oswald font-extralight tracking-tight">DAILY</span>
              <span className="font-fjalla font-extrabold italic">LEAP</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The main dashboard users see every day
            </p>
          </div>
          
          <div className="space-y-4">
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground font-oswald">WELCOME, <span className="font-bold italic">USER</span></p>
                  <p className="text-muted-foreground text-sm">Your journey continues</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🏆</div>
                  <div className="text-xs font-bold">7 DAY WARRIOR</div>
                  <div className="text-xs text-muted-foreground">Earned today</div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> The dashboard welcomes users by name and shows their latest achievements to build motivation.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Motivation & Streak Tracking",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">Daily Motivation & Progress</h2>
            <p className="text-lg text-muted-foreground">
              How users track their recovery journey
            </p>
          </div>
          
          <div className="flex gap-4">
            <Card className="bg-card p-4 rounded-lg w-[70%]">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-primary p-3 rounded-sm">
                  <Target className="text-primary-foreground" size={20} />
                </div>
                <h3 className="font-fjalla font-bold text-base uppercase tracking-wide">
                  TODAY'S MOTIVATION
                </h3>
              </div>
              <p className="text-sm italic">"Progress, not perfection, is the key to lasting change."</p>
            </Card>

            <Card className="bg-card p-4 rounded-lg w-[30%]">
              <div className="text-center">
                <h3 className="font-fjalla font-bold text-base uppercase tracking-wide mb-2">
                  STREAK
                </h3>
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="bg-primary p-3 rounded-sm">
                    <Flame className="text-primary-foreground" size={20} />
                  </div>
                  <div className="text-[28px] font-bold">15</div>
                </div>
                <p className="text-muted-foreground text-xs">days</p>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> Daily motivation quotes rotate based on user progress, and the streak counter shows completed days to build momentum.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Start Your Day",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">Journey Navigation</h2>
            <p className="text-lg text-muted-foreground">
              How users access their daily recovery activities
            </p>
          </div>
          
          <Card className="bg-black/[7.5%] p-4 rounded-lg">
            <h3 className="font-fjalla font-bold mb-2 tracking-wide">
              START YOUR DAY
            </h3>
            <div className="cursor-pointer">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-400 p-3 rounded-sm">
                    <Play className="text-black" size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">Day 16 of your journey</span>
                    <span className="text-xs text-muted-foreground">5-7 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-card p-4 rounded-lg">
            <h3 className="font-fjalla font-bold mb-4 tracking-wide">
              COMING UP THIS WEEK
            </h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm flex-1">Breathing exercises</span>
                <span className="text-primary font-bold text-sm">TOMORROW</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm flex-1">Gratitude practice</span>
                <span className="text-primary font-bold text-sm">IN 2 DAYS</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm flex-1">Trigger identification</span>
                <span className="text-primary font-bold text-sm">IN 3 DAYS</span>
              </div>
            </div>
          </Card>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> Users can see their current day and preview upcoming activities to build anticipation and reduce anxiety about what's coming.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "The Foreman AI",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">AI Support Features</h2>
            <p className="text-lg text-muted-foreground">
              24/7 AI-powered recovery coaching
            </p>
          </div>
          
          <Card className="relative bg-card rounded-lg overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/lovable-uploads/c61510da-8bef-4d57-8fba-f87d453bd59e.png)'
              }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 p-4">
              <div className="flex flex-col items-center text-center mb-4">
                <h3 className="font-fjalla font-bold text-white text-2xl tracking-wide">
                  THE FOREMAN
                </h3>
                <p className="text-white/80 text-sm">Your 24/7 recovery coach</p>
              </div>
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg">
                CHAT WITH THE FOREMAN
              </Button>
            </div>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <h4 className="font-semibold text-sm mb-2">Instant Support</h4>
              <p className="text-xs text-muted-foreground">Available 24/7 for crisis moments</p>
            </Card>
            <Card className="p-4 text-center">
              <h4 className="font-semibold text-sm mb-2">Personalized Advice</h4>
              <p className="text-xs text-muted-foreground">Tailored to your specific situation</p>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> The Foreman AI is a key differentiator, providing immediate support when human specialists aren't available.
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

export default DashboardHomeModule;