import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Flame, Target, Trophy, Calendar, Play, TrendingUp, Clock, Bot } from 'lucide-react';

interface DashboardHomeModuleProps {
  onComplete: () => void;
}

const DashboardHomeModule = ({ onComplete }: DashboardHomeModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "The Complete HOME Dashboard",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Full Dashboard Experience</h2>
            <p className="text-muted-foreground text-sm">
              This is what users see when they open LEAP - their complete daily dashboard
            </p>
          </div>
          
          {/* Recreate the actual dashboard layout */}
          <div className="bg-background p-4 rounded-lg border max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-1 tracking-wide">
                    <span className="font-oswald font-extralight tracking-tight">DAILY</span>
                    <span className="font-fjalla font-extrabold italic">LEAP</span>
                  </h1>
                  <div className="mt-4"></div>
                  <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
                    WELCOME, <span className="font-bold italic">SARAH</span>
                  </p>
                  <p className="text-muted-foreground text-sm">Your journey continues</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-2xl">🏆</div>
                  <div className="text-right">
                    <div className="text-sm font-fjalla font-bold text-foreground uppercase tracking-wide">MILESTONE</div>
                    <div className="text-xs text-muted-foreground">2 days ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {/* Motivation & Streak */}
              <div className="flex gap-2">
                <Card className="bg-card p-3 rounded-lg border-0 shadow-none w-[70%]">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-primary p-2 rounded-sm">
                      <Target className="text-primary-foreground" size={16} />
                    </div>
                    <h3 className="font-fjalla font-bold text-card-foreground text-sm uppercase">TODAY'S MOTIVATION</h3>
                  </div>
                  <p className="text-card-foreground text-xs italic">"Every day is a fresh start"</p>
                </Card>

                <Card className="bg-card p-3 rounded-lg border-0 shadow-none w-[30%]">
                  <div className="text-center">
                    <h3 className="font-fjalla font-bold text-card-foreground text-sm uppercase mb-1">STREAK</h3>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="bg-primary p-2 rounded-sm">
                        <Flame className="text-primary-foreground" size={16} />
                      </div>
                      <div className="text-lg font-bold text-card-foreground">7</div>
                    </div>
                    <p className="text-muted-foreground text-xs">days</p>
                  </div>
                </Card>
              </div>

              {/* Start Your Day */}
              <Card className="bg-black/[7.5%] p-3 rounded-lg border-0 shadow-none">
                <h3 className="font-fjalla font-bold text-card-foreground mb-2 text-sm">START YOUR DAY</h3>
                <div className="flex items-center space-x-2">
                  <div className="bg-yellow-400 p-2 rounded-sm">
                    <Play className="text-black" size={16} />
                  </div>
                  <span className="text-card-foreground font-source text-sm">Day 8: Building Confidence</span>
                </div>
              </Card>

              {/* Coming Up This Week */}
              <Card className="bg-card p-3 rounded-lg border-0 shadow-none">
                <h3 className="font-fjalla font-bold text-card-foreground mb-2 text-sm">COMING UP THIS WEEK</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-card-foreground text-xs">Mindfulness Practice</span>
                    <span className="text-primary text-xs font-bold">TOMORROW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-card-foreground text-xs">Peer Check-in</span>
                    <span className="text-primary text-xs font-bold">3 DAYS</span>
                  </div>
                </div>
              </Card>

              {/* The Foreman */}
              <Card className="relative bg-card rounded-lg border-0 shadow-none overflow-hidden">
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 p-3">
                  <div className="text-center mb-2">
                    <h3 className="font-fjalla font-bold text-white text-lg">THE FOREMAN</h3>
                    <p className="text-white/80 text-xs">Your 24/7 recovery companion</p>
                  </div>
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg text-sm">
                    CHAT NOW
                  </Button>
                </div>
              </Card>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> This is the complete HOME dashboard that users see every time they open LEAP. We'll now break down each section to understand its purpose.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Daily Motivation & Streak Tracking",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Motivation & Progress</h2>
            <p className="text-muted-foreground text-sm">
              Key components that keep users engaged daily
            </p>
          </div>
          
          <div className="flex gap-4">
            <Card className="bg-card p-4 rounded-lg border-0 shadow-none w-[70%]">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-primary p-3 rounded-sm">
                  <Target className="text-primary-foreground" size={20} />
                </div>
                <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                  TODAY'S MOTIVATION
                </h3>
              </div>
              <p className="text-card-foreground text-sm italic">"Recovery is not a destination, it's a journey of growth"</p>
            </Card>

            <Card className="bg-card p-4 rounded-lg border-0 shadow-none w-[30%]">
              <div className="text-center">
                <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide mb-2">
                  STREAK
                </h3>
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="bg-primary p-3 rounded-sm">
                    <Flame className="text-primary-foreground" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">7</div>
                </div>
                <p className="text-muted-foreground text-xs lowercase italic">days</p>
              </div>
            </Card>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> The motivation changes daily and is personalized. The streak tracks consecutive days of engagement, providing positive reinforcement.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Start Your Day Access",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Daily Journey Content</h2>
            <p className="text-muted-foreground text-sm">
              The primary entry point to structured recovery activities
            </p>
          </div>
          
          <Card className="bg-black/[7.5%] p-4 rounded-lg border-0 shadow-none cursor-pointer hover:bg-black/10 transition-colors">
            <h3 className="font-fjalla font-bold text-card-foreground mb-3 tracking-wide">
              START YOUR DAY
            </h3>
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-400 p-3 rounded-sm">
                <Play className="text-black" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-card-foreground font-source text-sm">
                  Day 8: Building Confidence
                </span>
                <span className="text-muted-foreground font-source text-xs">
                  Tap to begin today's journey
                </span>
              </div>
            </div>
          </Card>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> This button takes users to their personalized daily content. The day number progresses as users complete activities, and content is locked until previous days are finished.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Coming Up This Week Preview",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Upcoming Activities</h2>
            <p className="text-muted-foreground text-sm">
              Preview of future content to build anticipation
            </p>
          </div>
          
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none">
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">
              COMING UP THIS WEEK
            </h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-card-foreground font-source text-sm flex-1">
                  Mindfulness and Meditation Practice
                </span>
                <span className="text-primary font-source font-bold text-sm whitespace-nowrap">
                  TOMORROW
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-card-foreground font-source text-sm flex-1">
                  Peer Support Check-in
                </span>
                <span className="text-primary font-source font-bold text-sm whitespace-nowrap">
                  3 DAYS
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-card-foreground font-source text-sm flex-1">
                  Building Healthy Routines
                </span>
                <span className="text-primary font-source font-bold text-sm whitespace-nowrap">
                  5 DAYS
                </span>
              </div>
            </div>
          </Card>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>Training Note:</strong> Shows 3 random upcoming activities from the next week to give users something to look forward to and maintain engagement.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Functional Foreman in Dashboard",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Working Foreman Integration</h2>
            <p className="text-muted-foreground text-sm">
              Try the actual Foreman functionality right from the HOME dashboard
            </p>
          </div>
          
          {/* Import and use the functional Foreman chat */}
          <div className="w-full">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading Foreman...</span>
              </div>
            }>
              {React.createElement(
                React.lazy(() => import('./FunctionalForemanChat')),
                {
                  onMessageSent: (message: string) => {
                    console.log('Training message sent to Foreman:', message);
                  }
                }
              )}
            </Suspense>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Live Functionality</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This is the actual Foreman AI - try asking questions, sharing feelings, or requesting support.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Voice Features</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Enable audio for text-to-speech responses and try voice input using the microphone button.
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> Users can access this same Foreman functionality directly from their dashboard - no need to navigate elsewhere for immediate support.
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