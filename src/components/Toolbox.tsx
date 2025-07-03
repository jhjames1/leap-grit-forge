
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Wind, 
  Heart, 
  TrendingUp,
  Bot
} from 'lucide-react';

import BreathingExercise from '@/components/BreathingExercise';
import UrgeTracker from '@/components/UrgeTracker';
import GratitudeLogEnhanced from '@/components/GratitudeLogEnhanced';
import { useUserData } from '@/hooks/useUserData';

interface ToolboxProps {
  onNavigate?: (page: string) => void;
}

const Toolbox = ({ onNavigate }: ToolboxProps) => {
  const [showBreathing, setShowBreathing] = useState(false);
  const [showUrgeTracker, setShowUrgeTracker] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  const { userData, logActivity, updateToolboxStats } = useUserData();

  const handleEmergencyCall = () => {
    window.location.href = 'tel:+14327018678';
    logActivity('Emergency Call', 'Called emergency support line');
  };

  const tools = [
    {
      id: 'panic',
      title: 'Emergency Help',
      description: 'Get immediate support',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      badge: 'Emergency',
      badgeColor: 'bg-red-500'
    },
    {
      id: 'foreman',
      title: 'The Foreman',
      description: 'AI mentor & affirmations',
      icon: Bot,
      color: 'bg-construction hover:bg-construction-dark',
      badge: 'AI Chat',
      badgeColor: 'bg-construction'
    },
    {
      id: 'urge',
      title: 'Redline Recovery',
      description: 'Track urges & get redirected',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: 'Track',
      badgeColor: 'bg-construction'
    },
    {
      id: 'breathing',
      title: 'SteadySteel',
      description: 'Interactive breathing exercise',
      icon: Wind,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: 'Calm',
      badgeColor: 'bg-construction'
    },
    {
      id: 'gratitude',
      title: 'Gratitude Log',
      description: 'Focus on the positive',
      icon: Heart,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: 'Mindset',
      badgeColor: 'bg-construction'
    }
  ];

  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case 'panic':
        handleEmergencyCall();
        break;
      case 'foreman':
        logActivity('The Foreman', 'Started AI mentor session');
        onNavigate?.('foreman');
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
      default:
        console.log(`Opening ${toolId} tool`);
    }
  };

  const handleBreathingComplete = () => {
    setShowBreathing(false);
    logActivity('SteadySteel', 'Completed breathing exercise');
    if (userData) {
      updateToolboxStats({
        toolsToday: userData.toolboxStats.toolsToday + 1,
        totalSessions: userData.toolboxStats.totalSessions + 1
      });
    }
  };

  const handleUrgeTracked = () => {
    setShowUrgeTracker(false);
    logActivity('Redline Recovery', 'Tracked and redirected urge');
    if (userData) {
      updateToolboxStats({
        toolsToday: userData.toolboxStats.toolsToday + 1,
        urgesThisWeek: userData.toolboxStats.urgesThisWeek + 1
      });
    }
  };

  return (
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-anton text-3xl text-white mb-2">Recovery Toolbox</h1>
        <p className="text-steel-light font-oswald">Your support tools, always ready</p>
      </div>

      {/* Live Stats */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-anton text-construction">
              {userData?.toolboxStats.toolsToday || 0}
            </div>
            <div className="text-xs text-steel-light font-oswald">Tools Used Today</div>
          </div>
          <div>
            <div className="text-2xl font-anton text-construction">
              {userData?.toolboxStats.streak || 1}
            </div>
            <div className="text-xs text-steel-light font-oswald">Day Streak</div>
          </div>
          <div>
            <div className="text-2xl font-anton text-construction">
              {userData?.toolboxStats.totalSessions || 0}
            </div>
            <div className="text-xs text-steel-light font-oswald">Total Sessions</div>
          </div>
        </div>
      </Card>

      {/* Emergency Button */}
      <Button 
        onClick={() => handleToolClick('panic')}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-oswald font-bold py-6 mb-6 rounded-xl text-lg tracking-wide industrial-shadow"
      >
        <AlertTriangle className="mr-3" size={24} />
        I NEED HELP NOW
      </Button>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-4">
        {tools.filter(tool => tool.id !== 'panic').map((tool) => {
          const Icon = tool.icon;
          
          return (
            <Card 
              key={tool.id}
              className="bg-white/10 backdrop-blur-sm border-steel-dark hover:bg-white/15 hover:border-construction/30 transition-all duration-200 cursor-pointer group"
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg transition-all duration-200 ${
                    tool.id === 'foreman' 
                      ? 'bg-construction group-hover:bg-construction-light' 
                      : 'bg-steel group-hover:bg-construction'
                  }`}>
                    <Icon className={`transition-colors duration-200 ${
                      tool.id === 'foreman' ? 'text-midnight' : 'text-white group-hover:text-midnight'
                    }`} size={20} />
                  </div>
                  <Badge className={`${tool.badgeColor} text-midnight text-xs font-oswald transition-all duration-200`}>
                    {tool.badge}
                  </Badge>
                </div>
                
                <h3 className="font-oswald font-semibold text-white mb-2 group-hover:text-construction transition-colors duration-200">
                  {tool.title}
                </h3>
                <p className="text-steel-light text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Recent Activity */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mt-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {userData?.activityLog.length ? (
            userData.activityLog.slice(0, 3).map((activity, index) => (
              <div key={activity.id} className="flex items-center space-x-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-construction' : 'bg-steel'
                }`}></div>
                <span className="text-steel-light">
                  {activity.action} - <span className={`font-medium ${
                    index === 0 ? 'text-construction' : 'text-steel-light'
                  }`}>{activity.timestamp}</span>
                </span>
              </div>
            ))
          ) : (
            <div className="text-steel-light text-sm">
              Your activity will appear here as you use the tools.
            </div>
          )}
        </div>
      </Card>

      {/* Tool Modals */}
      {showBreathing && (
        <BreathingExercise onClose={handleBreathingComplete} />
      )}

      {showUrgeTracker && (
        <UrgeTracker 
          onClose={handleUrgeTracked} 
          onNavigate={onNavigate}
        />
      )}

      {showGratitudeLog && (
        <GratitudeLogEnhanced onClose={() => setShowGratitudeLog(false)} />
      )}
    </div>
  );
};

export default Toolbox;
