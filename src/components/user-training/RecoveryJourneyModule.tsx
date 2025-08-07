import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, Lock, Play, Clock, Target, Trophy } from 'lucide-react';

interface RecoveryJourneyModuleProps {
  onComplete: () => void;
}

const RecoveryJourneyModule = ({ onComplete }: RecoveryJourneyModuleProps) => {
  const [selectedDayPreview, setSelectedDayPreview] = useState<number | null>(null);

  // Mock data for realistic demonstration
  const totalDays = 90;
  const completedDays = 15; // User has completed 15 days
  const currentDay = 16; // Currently on day 16
  const progress = (completedDays / totalDays) * 100;

  const mockNext3Days = [
    {
      day: 16,
      title: "Morning Reflection",
      keyMessage: "Start your day with intention",
      tool: "Mindfulness",
      duration: "6 min",
      status: "unlocked"
    },
    {
      day: 17,
      title: "Trigger Recognition",
      keyMessage: "Understanding what sparks difficult moments",
      tool: "Awareness",
      duration: "8 min", 
      status: "locked"
    },
    {
      day: 18,
      title: "Building Resilience",
      keyMessage: "Strengthening your emotional foundation",
      tool: "Coping Skills",
      duration: "7 min",
      status: "locked"
    }
  ];

  const getDayStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'unlocked':
        return <Play className="h-5 w-5 text-primary" />;
      default:
        return <Lock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getButtonVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'outline' as const;
      case 'unlocked':
        return 'default' as const;
      default:
        return 'ghost' as const;
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'REVIEW';
      case 'unlocked':
        return 'START';
      default:
        return 'LOCKED';
    }
  };

  const handleDayPreview = (day: number) => {
    setSelectedDayPreview(selectedDayPreview === day ? null : day);
  };

  const getDayPreviewContent = (day: number) => {
    const dayData = mockNext3Days.find(d => d.day === day);
    if (!dayData) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-l-primary"
      >
        <h4 className="font-semibold mb-2">{dayData.title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{dayData.keyMessage}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Tool: {dayData.tool}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dayData.duration}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Training Module Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Recovery Journey Interface</h1>
              <p className="text-muted-foreground">
                Experience what users see in their daily journey progression
              </p>
            </div>

            {/* Simulated LEAP Journey Interface */}
            <div className="bg-[#F5F5F5] rounded-lg p-6 border-2 border-dashed border-primary/30">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                  <span className="font-oswald font-extralight tracking-tight">YOUR</span>
                  <span className="font-fjalla font-extrabold italic ml-2">JOURNEY</span>
                </h1>
                <p className="text-muted-foreground font-oswald">Your path to lasting recovery</p>
              </div>

              {/* Overall Progress Card */}
              <Card className="bg-card border-0 p-6 rounded-xl mb-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary p-2 rounded-lg">
                    <Target className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-oswald tracking-wide">OVERALL PROGRESS</h3>
                    <p className="text-sm text-muted-foreground font-source">
                      {completedDays} of {totalDays} days completed
                    </p>
                  </div>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-2 font-source">
                  {Math.round(progress)}% complete • Keep building your momentum
                </p>
              </Card>

              {/* Next 3 Days Card */}
              <Card className="bg-card border-0 rounded-xl shadow-sm">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-secondary p-2 rounded-lg">
                      <Trophy className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold font-oswald tracking-wide">NEXT 3 DAYS</h3>
                      <p className="text-sm text-muted-foreground font-source">Your upcoming recovery activities</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {mockNext3Days.map((day) => (
                      <div key={day.day}>
                        <Card 
                          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                            day.status === 'unlocked' ? 'border-primary/50' : 
                            day.status === 'completed' ? 'border-green-500/50' : 'border-muted'
                          }`}
                          onClick={() => handleDayPreview(day.day)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                                <span className="text-sm font-bold">D{day.day}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold text-sm">{day.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {day.tool}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{day.keyMessage}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{day.duration}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getDayStatusIcon(day.status)}
                              <Button 
                                variant={getButtonVariant(day.status)}
                                size="sm"
                                disabled={day.status === 'locked'}
                                className="font-semibold text-xs"
                              >
                                {getButtonText(day.status)}
                              </Button>
                            </div>
                          </div>
                        </Card>
                        {selectedDayPreview === day.day && getDayPreviewContent(day.day)}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Training Notes */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Journey Progression</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Users complete one day at a time, with each day unlocking the next. The progress bar shows overall journey completion.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Interactive Elements</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Day cards show tools, duration, and status. Users can click to preview content or start their daily activity.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Gamification</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Icons and colors indicate progress status - unlocked (blue), completed (green), locked (gray).
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">User Experience</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  The interface balances motivation with achievable daily goals, preventing overwhelm while maintaining momentum.
                </p>
              </div>
            </div>

            {/* Complete Module Button */}
            <div className="flex justify-center pt-6">
              <Button onClick={onComplete} size="lg" className="px-8">
                Complete Recovery Journey Training
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecoveryJourneyModule;