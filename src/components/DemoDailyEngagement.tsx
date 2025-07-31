import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Heart, Brain, Target, Award, Clock, Flame } from 'lucide-react';

interface DemoDailyEngagementProps {
  isVisible: boolean;
  onClose: () => void;
}

const dailyTools = [
  { id: 'breathing', label: 'Breathing Exercise', icon: Heart, duration: '5 min', completed: false },
  { id: 'journal', label: 'Daily Reflection', icon: Brain, duration: '10 min', completed: true },
  { id: 'goals', label: 'Goal Check-in', icon: Target, duration: '3 min', completed: false }
];

const achievements = [
  { id: 'week1', label: 'First Week Complete', icon: Award, unlocked: true },
  { id: 'streak7', label: '7-Day Streak', icon: Flame, unlocked: true },
  { id: 'tools50', label: '50 Tools Used', icon: CheckCircle2, unlocked: false }
];

export const DemoDailyEngagement: React.FC<DemoDailyEngagementProps> = ({ isVisible, onClose }) => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [breathingStarted, setBreathingStarted] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(0);

  if (!isVisible) return null;

  const startBreathingExercise = () => {
    setBreathingStarted(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setBreathingCount(count);
      if (count % 4 === 0) setBreathingPhase('hold');
      else if (count % 4 === 2) setBreathingPhase('exhale');
      else setBreathingPhase('inhale');
      
      if (count >= 20) {
        clearInterval(interval);
        setBreathingStarted(false);
        setBreathingCount(0);
        setCurrentTab('dashboard');
      }
    }, 1000);
  };

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <Card>
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-secondary">85%</div>
            <div className="text-xs text-muted-foreground">Weekly Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-accent">3</div>
            <div className="text-xs text-muted-foreground">New Badges</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Tools</CardTitle>
          <CardDescription>Complete your daily wellness activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyTools.map((tool) => (
            <div key={tool.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <tool.icon className={`w-5 h-5 ${tool.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium text-sm">{tool.label}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{tool.duration}</span>
                  </div>
                </div>
              </div>
              {tool.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Button size="sm" variant="outline" onClick={() => tool.id === 'breathing' && setCurrentTab('tools')}>
                  Start
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <Badge 
                key={achievement.id} 
                variant={achievement.unlocked ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                <achievement.icon className="w-3 h-3" />
                {achievement.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Breathing Exercise</CardTitle>
          <CardDescription>4-4-4-4 breathing pattern for relaxation</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {!breathingStarted ? (
            <>
              <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-16 h-16 text-primary" />
              </div>
              <Button onClick={startBreathingExercise} className="w-full">
                Start Breathing Exercise
              </Button>
            </>
          ) : (
            <>
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-1000 ${
                breathingPhase === 'inhale' ? 'bg-primary/30 scale-110' : 
                breathingPhase === 'hold' ? 'bg-primary/40 scale-110' : 'bg-primary/20 scale-100'
              }`}>
                <div className="text-2xl font-bold text-primary">
                  {breathingPhase === 'inhale' ? 'Inhale' : 
                   breathingPhase === 'hold' ? 'Hold' : 'Exhale'}
                </div>
              </div>
              <Progress value={(breathingCount / 20) * 100} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Breath {Math.floor(breathingCount / 4) + 1} of 5
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Engagement Demo</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
          <CardDescription>
            Experience your daily wellness dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-4">
              {renderDashboard()}
            </TabsContent>
            <TabsContent value="tools" className="mt-4">
              {renderTools()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};