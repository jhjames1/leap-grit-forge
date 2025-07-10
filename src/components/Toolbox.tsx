
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

  // Calculate daily reset at midnight
  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      const lastReset = localStorage.getItem('lastMidnightReset');
      const todayString = now.toDateString();
      
      if (lastReset !== todayString) {
        // Reset daily counters
        if (userData) {
          updateToolboxStats({
            toolsToday: 0
          });
        }
        localStorage.setItem('lastMidnightReset', todayString);
      }
    };

    checkMidnightReset();
    
    // Check every minute for midnight reset
    const interval = setInterval(checkMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [userData, updateToolboxStats]);

  // Calculate streak based on consecutive days with tool usage
  const calculateDayStreak = () => {
    if (!userData?.activityLog) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasToolUsage = userData.activityLog.some(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === dateString && 
               (entry.action.includes('Completed') && 
                (entry.action.includes('SteadySteel') || 
                 entry.action.includes('Redline Recovery') || 
                 entry.action.includes('Gratitude')));
      });
      
      if (hasToolUsage) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  // Get today's completed tools count
  const getTodayToolsCount = () => {
    if (!userData?.activityLog) return 0;
    
    const today = new Date().toDateString();
    const completedToolsToday = userData.activityLog.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.toDateString() === today && 
             entry.action.includes('Completed') &&
             (entry.action.includes('SteadySteel') || 
              entry.action.includes('Redline Recovery') || 
              entry.action.includes('Gratitude') ||
              entry.action.includes('The Foreman'));
    });
    
    return completedToolsToday.length;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${month}-${day}-${year}, ${hours}:${minutes} ${ampm}`;
  };

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
      description: 'Mentor and Affirmations',
      icon: Bot,
      color: 'bg-steel hover:bg-steel-light',
      badge: 'AI Chat',
      badgeColor: 'bg-steel'
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
        logActivity('Started The Foreman', 'Opened AI mentor session');
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
    logActivity('Completed SteadySteel', 'Finished breathing exercise');
    if (userData) {
      updateToolboxStats({
        totalSessions: userData.toolboxStats.totalSessions + 1
      });
    }
  };

  const handleBreathingClose = () => {
    setShowBreathing(false);
    // Don't log completion if closed without finishing
  };

  const handleUrgeTracked = () => {
    setShowUrgeTracker(false);
    logActivity('Completed Redline Recovery', 'Tracked and redirected urge');
    if (userData) {
      updateToolboxStats({
        urgesThisWeek: userData.toolboxStats.urgesThisWeek + 1,
        totalSessions: userData.toolboxStats.totalSessions + 1
      });
    }
  };

  const handleUrgeClose = () => {
    setShowUrgeTracker(false);
    // Don't log completion if closed without finishing
  };

  const handleGratitudeComplete = () => {
    setShowGratitudeLog(false);
    logActivity('Completed Gratitude Log', 'Added gratitude entry');
    if (userData) {
      updateToolboxStats({
        totalSessions: userData.toolboxStats.totalSessions + 1
      });
    }
  };

  const handleGratitudeClose = () => {
    setShowGratitudeLog(false);
    // Don't log completion if closed without finishing
  };

  const dayStreak = calculateDayStreak();
  const todayToolsCount = getTodayToolsCount();

  return (
    <div className="p-4 pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          <span className="font-oswald font-extralight tracking-tight">RECOVERY</span><span className="font-fjalla font-extrabold italic">TOOLBOX</span>
        </h1>
        <p className="text-steel-light font-oswald">Your support tools, always ready</p>
      </div>

      {/* Live Stats with updated tracking */}
      <Card className="bg-card mb-6 p-4 border-0 shadow-none">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-muted-foreground">
              {todayToolsCount}
            </div>
            <div className="text-xs text-muted-foreground font-source">Tools Used Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">
              {dayStreak}
            </div>
            <div className="text-xs text-muted-foreground font-source">Day Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">
              {userData?.toolboxStats.totalSessions || 0}
            </div>
            <div className="text-xs text-muted-foreground font-source">Total Sessions</div>
          </div>
        </div>
      </Card>

      {/* Emergency Button */}
      <Button 
        onClick={() => handleToolClick('panic')}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-fjalla font-bold py-6 mb-6 rounded-xl text-lg tracking-wide"
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
              className="bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group border-0 shadow-none"
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-lg transition-all duration-200 bg-primary group-hover:bg-primary/80">
                    <Icon className="transition-colors duration-200 text-primary-foreground" size={20} />
                  </div>
                  <Badge className={`${tool.badgeColor} text-white text-xs font-source transition-all duration-200`}>
                    {tool.badge}
                  </Badge>
                </div>
                
                <h3 className="font-fjalla font-bold text-card-foreground mb-2 group-hover:text-muted-foreground transition-colors duration-200">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-source">
                  {tool.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Recent Activity with updated timestamp format */}
      <Card className="bg-card mt-6 p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {userData?.activityLog.length ? (
            userData.activityLog
              .filter(activity => activity.action.includes('Completed'))
              .slice(0, 3)
              .map((activity, index) => (
                <div key={activity.id} className="flex items-center space-x-3 text-sm">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-muted-foreground' : 'bg-muted'
                  }`}></div>
                  <span className="text-muted-foreground font-source">
                    {activity.action} - <span className={`font-medium ${
                      index === 0 ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>{formatTimestamp(activity.timestamp)}</span>
                  </span>
                </div>
              ))
          ) : (
            <div className="text-muted-foreground text-sm font-source">
              Your completed activities will appear here as you use the tools.
            </div>
          )}
        </div>
      </Card>

      {/* Tool Modals with completion tracking */}
      {showBreathing && (
        <BreathingExercise 
          onClose={handleBreathingComplete} 
          onCancel={handleBreathingClose}
        />
      )}

      {showUrgeTracker && (
        <UrgeTracker 
          onClose={handleUrgeTracked} 
          onCancel={handleUrgeClose}
          onNavigate={onNavigate}
        />
      )}

      {showGratitudeLog && (
        <GratitudeLogEnhanced 
          onClose={handleGratitudeComplete}
          onCancel={handleGratitudeClose}
        />
      )}
    </div>
  );
};

export default Toolbox;
