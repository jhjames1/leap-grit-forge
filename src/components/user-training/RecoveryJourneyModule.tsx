import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, Trophy, Star, Heart, CheckCircle, Target } from 'lucide-react';

interface RecoveryJourneyModuleProps {
  onComplete: () => void;
}

const RecoveryJourneyModule = ({ onComplete }: RecoveryJourneyModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const steps = [
    {
      title: "Your Recovery Calendar",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Calendar className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Track Your Journey</h2>
            <p className="text-lg text-muted-foreground">
              See your progress one day at a time
            </p>
          </div>
          
          {/* Mock Calendar */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">January 2024</h3>
              <Badge variant="secondary">Day 45 of Recovery</Badge>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {[...Array(31)].map((_, i) => {
                const dayNum = i + 1;
                const isCompleted = dayNum <= 15;
                const isToday = dayNum === 16;
                const isFuture = dayNum > 16;
                
                return (
                  <Button
                    key={dayNum}
                    variant={isToday ? "default" : "ghost"}
                    size="sm"
                    className={`h-10 w-10 p-0 relative ${
                      isCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      isFuture ? 'opacity-50' : ''
                    }`}
                    onClick={() => setSelectedDay(dayNum)}
                  >
                    {dayNum}
                    {isCompleted && (
                      <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-green-600" />
                    )}
                    {isToday && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
          
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 rounded-lg"
            >
              <h4 className="font-semibold mb-2">Day {selectedDay}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedDay <= 15 ? 'Completed: Daily check-in, peer chat' : 
                 selectedDay === 16 ? 'Today: Morning reflection pending' :
                 'Future: Not yet available'}
              </p>
            </motion.div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> The calendar gives users a visual sense of progress and helps them see that recovery is a daily journey.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Milestones & Achievements",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Celebrate Your Wins</h2>
            <p className="text-lg text-muted-foreground">
              Every milestone matters, no matter how small
            </p>
          </div>
          
          <div className="grid gap-4">
            <Card className="p-6 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/30">
              <div className="flex items-center gap-4">
                <Trophy className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">7 Days Strong</h4>
                  <p className="text-sm text-green-600 dark:text-green-300">Completed your first week!</p>
                  <Badge variant="secondary" className="mt-1">Achieved 8 days ago</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-4">
                <Heart className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">First Peer Connection</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Made your first meaningful chat connection</p>
                  <Badge variant="secondary" className="mt-1">Achieved 5 days ago</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
              <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Daily Warrior</h4>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">7 days of consistent check-ins</p>
                  <Badge variant="secondary" className="mt-1">Achieved 2 days ago</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-gray-300 bg-gray-50 dark:bg-gray-950/30 opacity-60">
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-gray-500" />
                <div>
                  <h4 className="font-semibold text-gray-600">30 Day Champion</h4>
                  <p className="text-sm text-gray-500">Complete 30 days of recovery</p>
                  <Badge variant="outline" className="mt-1">14 days to go</Badge>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> Celebrating small wins builds momentum and keeps users engaged during difficult periods.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Strength Meter",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="relative mx-auto w-32 h-32 mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.75)}`}
                  className="text-primary"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">75%</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Your Recovery Strength</h2>
            <p className="text-lg text-muted-foreground">
              Based on your daily activities and engagement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Positive Factors
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Daily check-ins</span>
                  <span className="text-green-600">+15 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Peer conversations</span>
                  <span className="text-green-600">+20 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Consistent engagement</span>
                  <span className="text-green-600">+25 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Milestone achievements</span>
                  <span className="text-green-600">+15 points</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Growth Areas
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Exercise activities</span>
                  <span className="text-blue-600">Opportunity</span>
                </div>
                <div className="flex justify-between">
                  <span>Gratitude practice</span>
                  <span className="text-blue-600">Opportunity</span>
                </div>
                <div className="flex justify-between">
                  <span>Goal setting</span>
                  <span className="text-blue-600">Opportunity</span>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-6 bg-primary/10">
            <h4 className="font-semibold mb-2">Today's Boost</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Complete a breathing exercise to increase your strength meter by 5 points
            </p>
            <Button size="sm">
              Start Breathing Exercise
            </Button>
          </Card>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> The strength meter gamifies recovery while providing meaningful feedback on user engagement.
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

export default RecoveryJourneyModule;