
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, MessageCircle, BookOpen, Trophy, Calendar } from 'lucide-react';

const DashboardHome = () => {
  const [streakDays] = useState(23);
  const [nextMilestone] = useState(30);
  const progressPercentage = (streakDays / nextMilestone) * 100;

  const dailyQuotes = [
    "Every day is a new opportunity to build the life you want.",
    "Strength doesn't come from what you can do. It comes from overcoming what you thought you couldn't.",
    "The only impossible journey is the one you never begin.",
    "Recovery is not a destination, it's a way of life."
  ];

  const [currentQuote] = useState(dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]);

  return (
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-anton text-3xl text-white mb-2">Daily LEAP</h1>
        <p className="text-steel-light font-oswald">Your recovery journey continues</p>
      </div>

      {/* Daily Quote Card */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-start space-x-3">
          <div className="bg-construction p-2 rounded-lg">
            <Target className="text-midnight" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-oswald font-semibold text-white mb-2">Today's Motivation</h3>
            <p className="text-steel-light italic leading-relaxed">"{currentQuote}"</p>
          </div>
        </div>
      </Card>

      {/* Progress Streak */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-construction p-2 rounded-lg">
              <Flame className="text-midnight" size={20} />
            </div>
            <div>
              <h3 className="font-oswald font-semibold text-white">Recovery Streak</h3>
              <p className="text-steel-light text-sm">{streakDays} days strong</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-anton text-construction">{streakDays}</div>
            <div className="text-xs text-steel-light font-oswald">DAYS</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-steel-light">Next milestone</span>
            <span className="text-construction font-oswald font-medium">{nextMilestone} days</span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-steel-dark">
            <div 
              className="h-full bg-gradient-to-r from-construction to-construction-light rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </Progress>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold p-6 h-auto flex flex-col items-center space-y-2 rounded-xl industrial-shadow">
          <BookOpen size={24} />
          <span>Today's Lesson</span>
        </Button>
        
        <Button className="bg-steel hover:bg-steel-light text-white font-oswald font-semibold p-6 h-auto flex flex-col items-center space-y-2 rounded-xl industrial-shadow">
          <MessageCircle size={24} />
          <span>Check-in</span>
        </Button>
      </div>

      {/* Recent Achievements */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction p-2 rounded-lg">
            <Trophy className="text-midnight" size={20} />
          </div>
          <h3 className="font-oswald font-semibold text-white">Recent Achievements</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-construction/10 rounded-lg">
            <div className="w-8 h-8 bg-construction rounded-full flex items-center justify-center">
              <Calendar size={16} className="text-midnight" />
            </div>
            <div>
              <p className="text-white font-medium">3-Week Milestone</p>
              <p className="text-steel-light text-sm">Earned 2 days ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-steel/10 rounded-lg">
            <div className="w-8 h-8 bg-steel rounded-full flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-medium">First Check-in</p>
              <p className="text-steel-light text-sm">Earned 1 week ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardHome;
