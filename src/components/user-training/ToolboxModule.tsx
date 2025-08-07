import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, Wind, Heart, TrendingUp, Bot, Radar, FileText } from 'lucide-react';

// Import functional tools
import BreathingExercise from '@/components/BreathingExercise';
import UrgeTracker from '@/components/UrgeTracker';
import GratitudeLogEnhanced from '@/components/GratitudeLogEnhanced';
import TriggerIdentifier from '@/components/TriggerIdentifier';
import ThoughtPatternSorter from '@/components/ThoughtPatternSorter';

interface ToolboxModuleProps {
  onComplete: () => void;
}

const ToolboxModule = ({ onComplete }: ToolboxModuleProps) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  // Tool modal states
  const [showBreathing, setShowBreathing] = useState(false);
  const [showUrgeTracker, setShowUrgeTracker] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  const [showTriggerIdentifier, setShowTriggerIdentifier] = useState(false);
  const [showThoughtPatternSorter, setShowThoughtPatternSorter] = useState(false);

  const mockStats = {
    toolsToday: 3,
    dayStreak: 7,
    totalSessions: 42
  };

  const tools = [
    {
      id: 'panic',
      title: 'EMERGENCY HELP',
      description: 'Immediate crisis support',
      icon: AlertTriangle,
      color: 'bg-red-600',
      badge: 'Emergency',
      badgeColor: 'bg-red-500'
    },
    {
      id: 'foreman',
      title: 'THE FOREMAN',
      description: 'Your AI recovery companion',
      icon: Bot,
      color: 'bg-primary',
      badge: 'AI Mentor',
      badgeColor: 'bg-primary'
    },
    {
      id: 'urge',
      title: 'REDLINE RECOVERY',
      description: 'Track and redirect urges',
      icon: TrendingUp,
      color: 'bg-primary',
      badge: 'Tracking',
      badgeColor: 'bg-construction'
    },
    {
      id: 'breathing',
      title: 'STEADYSTEEL',
      description: 'Breathing & relaxation',
      icon: Wind,
      color: 'bg-primary',
      badge: 'Mindfulness',
      badgeColor: 'bg-construction'
    },
    {
      id: 'gratitude',
      title: 'GRATITUDE LOG',
      description: 'Daily thankfulness practice',
      icon: Heart,
      color: 'bg-primary',
      badge: 'Wellness',
      badgeColor: 'bg-construction'
    },
    {
      id: 'trigger',
      title: 'TRIGGER IDENTIFIER',
      description: 'Discover and manage triggers',
      icon: Radar,
      color: 'bg-primary',
      badge: 'Analysis',
      badgeColor: 'bg-construction'
    }
  ];

  const recentActivity = [
    { action: 'Completed SteadySteel', time: '10:30 AM', recent: true },
    { action: 'Completed Gratitude Log', time: '9:15 AM', recent: false },
    { action: 'Completed The Foreman', time: 'Yesterday 8:45 PM', recent: false }
  ];

  const handleToolClick = (toolId: string) => {
    setSelectedTool(selectedTool === toolId ? null : toolId);
  };

  const handleLaunchTool = (toolId: string) => {
    switch (toolId) {
      case 'panic':
        alert('Emergency feature - In a real app, this would connect to crisis support resources and emergency helplines.');
        break;
      case 'foreman':
        alert('The Foreman - In a real app, this would open the AI-powered mentor providing personalized guidance 24/7.');
        break;
      case 'breathing':
        setShowBreathing(true);
        break;
      case 'urge':
        setShowUrgeTracker(true);
        break;
      case 'gratitude':
        setShowGratitudeLog(true);
        break;
      case 'trigger':
        setShowTriggerIdentifier(true);
        break;
    }
  };

  const getToolDescription = (toolId: string) => {
    const descriptions = {
      'panic': 'Connects you immediately to crisis support resources and emergency helplines.',
      'foreman': 'AI-powered mentor providing personalized guidance and support 24/7.',
      'urge': 'Helps track urges, understand patterns, and redirect to healthy activities.',
      'breathing': 'Guided breathing exercises and relaxation techniques for anxiety relief.',
      'gratitude': 'Build resilience through daily gratitude practice and reflection.',
      'trigger': 'Identify personal triggers and develop targeted coping strategies.'
    };
    return descriptions[toolId as keyof typeof descriptions] || '';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Training Module Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Toolbox Interface</h1>
              <p className="text-muted-foreground">
                Experience the real LEAP app's recovery toolkit
              </p>
            </div>

            {/* Simulated LEAP Toolbox Interface */}
            <div className="bg-[#F5F5F5] rounded-lg border-2 border-dashed border-primary/30 p-6">
              {/* Header - exactly like real app */}
              <div className="mb-6">
                <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                  <span className="font-oswald font-extralight tracking-tight">TOOL</span>
                  <span className="font-fjalla font-extrabold italic">BOX</span>
                </h1>
                <p className="text-muted-foreground font-oswald">Your recovery toolkit</p>
              </div>

              {/* Live Stats Card - exactly like real app */}
              <Card className="bg-card border-0 p-6 rounded-xl mb-6 shadow-sm">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {mockStats.toolsToday}
                    </div>
                    <div className="text-xs text-muted-foreground font-source">Tools Today</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {mockStats.dayStreak}
                    </div>
                    <div className="text-xs text-muted-foreground font-source">Day Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {mockStats.totalSessions}
                    </div>
                    <div className="text-xs text-muted-foreground font-source">Total Sessions</div>
                  </div>
                </div>
              </Card>

              {/* Emergency Button - exactly like real app */}
              <Button 
                onClick={() => handleToolClick('panic')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 mb-6 rounded-xl text-lg tracking-wide"
              >
                <AlertTriangle className="mr-3" size={24} />
                EMERGENCY HELP
              </Button>

              {/* Tools Grid - exactly like real app */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {tools.filter(tool => tool.id !== 'panic').map((tool) => {
                  const Icon = tool.icon;
                  const isSelected = selectedTool === tool.id;
                  
                  return (
                    <Card 
                      key={tool.id}
                      className={`bg-card p-4 rounded-lg transition-all duration-300 border-0 shadow-none cursor-pointer hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-3 rounded-lg bg-primary">
                          <Icon className="text-primary-foreground" size={20} />
                        </div>
                        <h3 className="font-fjalla font-bold text-sm tracking-wide text-center text-card-foreground">
                          {tool.title}
                        </h3>
                        <p className="text-muted-foreground text-sm text-center">{tool.description}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Tool Details - Interactive */}
              {selectedTool && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Card className="bg-primary/10 border-primary/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-primary">
                      {tools.find(t => t.id === selectedTool)?.title}
                    </h4>
                    <p className="text-sm text-foreground">
                      {getToolDescription(selectedTool)}
                    </p>
                    <Button size="sm" className="mt-3" onClick={() => handleLaunchTool(selectedTool)}>
                      Launch Tool
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* Recent Activity - exactly like real app */}
              <Card className="bg-card p-6 border-0 shadow-sm rounded-xl">
                <h3 className="font-fjalla font-bold text-card-foreground text-sm tracking-wide mb-4">
                  RECENT ACTIVITY
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.recent ? 'bg-primary' : 'bg-muted'
                      }`}></div>
                      <span className="text-muted-foreground font-source">
                        {activity.action} - <span className={`font-medium ${
                          activity.recent ? 'text-primary' : 'text-muted-foreground'
                        }`}>{activity.time}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Training Notes */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Real-Time Statistics</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The stats card shows live usage data including daily tool usage, streaks, and total sessions completed.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Emergency Access</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The prominent emergency button ensures users can quickly access crisis support when needed.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Recovery Tools</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Each tool is designed for specific recovery needs - from crisis management to daily wellness practices.
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Activity Tracking</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Recent activity shows users their progress and encourages continued engagement with the tools.
                </p>
              </div>
            </div>

            {/* Interactive Demo Note */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-center">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Try It:</strong> Click on any tool above to see details about its functionality!
              </p>
            </div>

            {/* Complete Module Button */}
            <div className="flex justify-center pt-6">
              <Button onClick={onComplete} size="lg" className="px-8">
                Complete Toolbox Training
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            {/* Functional Tool Modals */}
            {showBreathing && (
              <BreathingExercise 
                onClose={() => setShowBreathing(false)} 
                onCancel={() => setShowBreathing(false)}
              />
            )}

            {showUrgeTracker && (
              <UrgeTracker 
                onClose={() => setShowUrgeTracker(false)} 
                onCancel={() => setShowUrgeTracker(false)}
                onNavigate={() => {}}
              />
            )}

            {showGratitudeLog && (
              <GratitudeLogEnhanced 
                onClose={() => setShowGratitudeLog(false)}
                onCancel={() => setShowGratitudeLog(false)}
              />
            )}

            {showTriggerIdentifier && (
              <TriggerIdentifier 
                onClose={() => setShowTriggerIdentifier(false)}
                onCancel={() => setShowTriggerIdentifier(false)}
                onNavigate={() => {}}
              />
            )}

            {showThoughtPatternSorter && (
              <ThoughtPatternSorter 
                onClose={() => setShowThoughtPatternSorter(false)}
                onCancel={() => setShowThoughtPatternSorter(false)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolboxModule;