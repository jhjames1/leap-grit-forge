
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Play, Clock, Target } from 'lucide-react';

const RecoveryJourney = () => {
  const [currentDay] = useState(23);
  const totalDays = 90;
  const progress = (currentDay / totalDays) * 100;

  const modules = [
    {
      day: 1,
      title: "Starting Your Journey",
      completed: true,
      type: "Foundation",
      duration: "5 min"
    },
    {
      day: 2,
      title: "Understanding Triggers",
      completed: true,
      type: "Awareness",
      duration: "7 min"
    },
    {
      day: 3,
      title: "Building Your Support Network",
      completed: true,
      type: "Connection",
      duration: "6 min"
    },
    // Current day
    {
      day: 23,
      title: "Handling Work Stress",
      completed: false,
      unlocked: true,
      type: "Practical Skills",
      duration: "8 min"
    },
    {
      day: 24,
      title: "Weekend Recovery Strategies",
      completed: false,
      unlocked: false,
      type: "Lifestyle",
      duration: "9 min"
    },
    {
      day: 25,
      title: "Peer Communication",
      completed: false,
      unlocked: false,
      type: "Relationships",
      duration: "7 min"
    }
  ];

  return (
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-anton text-3xl text-white mb-2">Recovery Journey</h1>
        <p className="text-steel-light font-oswald">90-day guided track</p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction p-2 rounded-lg">
            <Target className="text-midnight" size={20} />
          </div>
          <div>
            <h3 className="font-oswald font-semibold text-white">Overall Progress</h3>
            <p className="text-steel-light text-sm">Day {currentDay} of {totalDays}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-steel-light">Journey Progress</span>
            <span className="text-construction font-oswald font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-steel-dark">
            <div 
              className="h-full bg-gradient-to-r from-construction to-construction-light rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </Progress>
        </div>
      </Card>

      {/* Module List */}
      <div className="space-y-4">
        {modules.map((module) => (
          <Card 
            key={module.day}
            className={`border-steel-dark p-4 transition-all duration-200 ${
              module.completed 
                ? 'bg-construction/10 border-construction/30' 
                : module.unlocked 
                  ? 'bg-white/10 backdrop-blur-sm hover:bg-white/15' 
                  : 'bg-steel-dark/20 border-steel-dark/50'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Status Icon */}
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                module.completed 
                  ? 'bg-construction' 
                  : module.unlocked 
                    ? 'bg-steel' 
                    : 'bg-steel-dark'
              }`}>
                {module.completed ? (
                  <CheckCircle2 className="text-midnight" size={20} />
                ) : module.unlocked ? (
                  <Play className="text-white" size={20} />
                ) : (
                  <Lock className="text-steel-light" size={20} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-oswald font-semibold text-construction text-sm">
                    DAY {module.day}
                  </span>
                  <span className="text-steel-light text-xs">•</span>
                  <span className="text-steel-light text-xs font-oswald uppercase tracking-wide">
                    {module.type}
                  </span>
                </div>
                
                <h3 className={`font-oswald font-medium mb-1 ${
                  module.completed || module.unlocked ? 'text-white' : 'text-steel-light'
                }`}>
                  {module.title}
                </h3>
                
                <div className="flex items-center space-x-2 text-xs text-steel-light">
                  <Clock size={12} />
                  <span>{module.duration}</span>
                </div>
              </div>

              {/* Action Button */}
              {module.unlocked && !module.completed && (
                <Button className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold px-4 py-2 rounded-lg">
                  Start
                </Button>
              )}
              
              {module.completed && (
                <Button variant="outline" className="border-construction text-construction hover:bg-construction/10 font-oswald font-medium px-4 py-2 rounded-lg">
                  Review
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Coming Up Section */}
      <Card className="bg-white/5 backdrop-blur-sm border-steel-dark mt-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-3">Coming Up This Week</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-steel-light">Day 24: Weekend Recovery Strategies</span>
            <span className="text-construction font-oswald">Tomorrow</span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel-light">Day 25: Peer Communication</span>
            <span className="text-steel-light font-oswald">2 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel-light">Day 30: Month Milestone Review</span>
            <span className="text-construction font-oswald">1 week</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecoveryJourney;
