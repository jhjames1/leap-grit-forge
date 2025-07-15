
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Wind, 
  Heart, 
  TrendingUp,
  Bot,
  Radar
} from 'lucide-react';

import BreathingExercise from '@/components/BreathingExercise';
import UrgeTracker from '@/components/UrgeTracker';
import GratitudeLogEnhanced from '@/components/GratitudeLogEnhanced';
import TriggerIdentifier from '@/components/TriggerIdentifier';
import ThoughtPatternSorter from '@/components/ThoughtPatternSorter';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackingManager } from '@/utils/trackingManager';
import { logger } from '@/utils/logger';

interface ToolboxProps {
  onNavigate?: (page: string) => void;
}

const Toolbox = ({ onNavigate }: ToolboxProps) => {
  const [showBreathing, setShowBreathing] = useState(false);
  const [showUrgeTracker, setShowUrgeTracker] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  const [showTriggerIdentifier, setShowTriggerIdentifier] = useState(false);
  const [showThoughtPatternSorter, setShowThoughtPatternSorter] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const { userData, logActivity, updateToolboxStats } = useUserData();
  const { t } = useLanguage();

  // Get real-time tracking data and activity updates
  useEffect(() => {
    const updateStats = () => {
      try {
        const liveStats = trackingManager.getTodaysStats();
        const streakData = trackingManager.getStreakData();
        setRealTimeStats({ 
          ...liveStats, 
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak
        });
      } catch (error) {
        // Fallback to userData if tracking manager fails
        console.warn('TrackingManager failed, using userData:', error);
        setRealTimeStats(null);
      }
    };
    
    // Update immediately and then every 2 seconds for real-time feel
    updateStats();
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, [userData]);

  // Update activity display when activity log changes
  useEffect(() => {
    if (userData?.activityLog) {
      setActivityRefreshKey(prev => prev + 1);
    }
  }, [userData?.activityLog?.length]);

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
      title: t('toolbox.tools.emergencyHelp'),
      description: t('toolbox.tools.emergencyDesc'),
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      badge: 'Emergency',
      badgeColor: 'bg-red-500'
    },
    {
      id: 'foreman',
      title: t('toolbox.tools.foreman.title'),
      description: t('toolbox.tools.foreman.description'),
      icon: Bot,
      color: 'bg-steel hover:bg-steel-light',
      badge: t('toolbox.tools.foreman.badge'),
      badgeColor: 'bg-steel'
    },
    {
      id: 'urge',
      title: t('toolbox.tools.urgeTracker.title'),
      description: t('toolbox.tools.urgeTracker.description'),
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: t('toolbox.tools.urgeTracker.badge'),
      badgeColor: 'bg-construction'
    },
    {
      id: 'breathing',
      title: t('toolbox.tools.breathingExercise.title'),
      description: t('toolbox.tools.breathingExercise.description'),
      icon: Wind,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: t('toolbox.tools.breathingExercise.badge'),
      badgeColor: 'bg-construction'
    },
    {
      id: 'gratitude',
      title: t('toolbox.tools.gratitudeLog.title'),
      description: t('toolbox.tools.gratitudeLog.description'),
      icon: Heart,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: t('toolbox.tools.gratitudeLog.badge'),
      badgeColor: 'bg-construction'
    },
    {
      id: 'trigger',
      title: 'Trigger Identifier',
      description: 'Discover and manage your triggers',
      icon: Radar,
      color: 'bg-gradient-to-br from-steel to-steel-light hover:from-construction/80 hover:to-construction',
      badge: 'Analysis',
      badgeColor: 'bg-construction'
    },
    {
      id: 'thought-pattern-sorter',
      title: 'Thought Pattern Sorter',
      description: 'Practice identifying healthy vs unhelpful thinking patterns',
      icon: Bot,
      color: 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary',
      badge: 'Mind Training',
      badgeColor: 'bg-primary'
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
      case 'trigger':
        setShowTriggerIdentifier(true);
        break;
      case 'thought-pattern-sorter':
        setShowThoughtPatternSorter(true);
        break;
      default:
        logger.debug('Tool opened', { toolId });
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

  const handleTriggerIdentifierComplete = () => {
    setShowTriggerIdentifier(false);
    logActivity('Completed Trigger Identifier', 'Mapped personal triggers to coping strategies');
    if (userData) {
      updateToolboxStats({
        totalSessions: userData.toolboxStats.totalSessions + 1
      });
    }
  };

  const handleTriggerIdentifierClose = () => {
    setShowTriggerIdentifier(false);
    // Don't log completion if closed without finishing
  };

  const handleThoughtPatternSorterComplete = () => {
    setShowThoughtPatternSorter(false);
    // Game handles its own completion logging
  };

  const handleThoughtPatternSorterClose = () => {
    setShowThoughtPatternSorter(false);
    // Don't log completion if closed without finishing
  };

  // Use real-time stats when available, fallback to calculated values
  const liveToolsToday = realTimeStats?.toolsUsedToday ?? getTodayToolsCount();
  const liveDayStreak = realTimeStats?.currentStreak ?? calculateDayStreak();
  const liveTotalSessions = userData?.toolboxStats?.totalSessions || 0;

  return (
    <div className="p-4 pb-24 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          <span className="font-oswald font-extralight tracking-tight">TOOL</span><span className="font-fjalla font-extrabold italic">BOX</span>
        </h1>
        <p className="text-muted-foreground font-oswald">{t('toolbox.subtitle')}</p>
      </div>

      {/* Live Stats */}
      <Card className="bg-card border-0 p-6 rounded-xl mb-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {liveToolsToday}
            </div>
            <div className="text-xs text-muted-foreground font-source">Tools Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {liveDayStreak}
            </div>
            <div className="text-xs text-muted-foreground font-source">{t('toolbox.stats.dayStreak')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {liveTotalSessions}
            </div>
            <div className="text-xs text-muted-foreground font-source">{t('toolbox.stats.totalSessions')}</div>
          </div>
        </div>
      </Card>

      {/* Emergency Button */}
      <Button 
        onClick={() => handleToolClick('panic')}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 mb-6 rounded-xl text-lg tracking-wide"
      >
        <AlertTriangle className="mr-3" size={24} />
        {t('toolbox.emergency.button').toUpperCase()}
      </Button>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-4">
        {tools.filter(tool => tool.id !== 'panic').map((tool) => {
          const Icon = tool.icon;
          
          return (
            <Card 
              key={tool.id}
              className="bg-card p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-300 border-0 shadow-none"
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-primary p-3 rounded-lg">
                  <Icon className="text-primary-foreground" size={20} />
                </div>
                <h3 className="font-fjalla font-bold text-card-foreground text-sm tracking-wide text-center">{tool.title.toUpperCase()}</h3>
                <p className="text-muted-foreground text-sm text-center">{tool.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Recent Activity */}
      <Card className="bg-card mt-6 p-6 border-0 shadow-sm rounded-xl" key={activityRefreshKey}>
        <h3 className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">{t('toolbox.recentActivity').toUpperCase()}</h3>
        <div className="space-y-3">
          {userData?.activityLog.length ? (
            userData.activityLog
              .filter(activity => activity.action.includes('Completed'))
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 3)
              .map((activity, index) => (
                <div key={activity.id} className="flex items-center space-x-3 text-sm">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-primary' : 'bg-muted'
                  }`}></div>
                  <span className="text-muted-foreground font-source">
                    {activity.action} - <span className={`font-medium ${
                      index === 0 ? 'text-primary' : 'text-muted-foreground'
                    }`}>{formatTimestamp(activity.timestamp)}</span>
                  </span>
                </div>
              ))
          ) : (
            <div className="text-muted-foreground text-sm font-source">
              {t('toolbox.recentActivityEmpty')}
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

      {showTriggerIdentifier && (
        <TriggerIdentifier 
          onClose={handleTriggerIdentifierComplete}
          onCancel={handleTriggerIdentifierClose}
          onNavigate={onNavigate}
        />
      )}

      {showThoughtPatternSorter && (
        <ThoughtPatternSorter 
          onClose={handleThoughtPatternSorterComplete}
          onCancel={handleThoughtPatternSorterClose}
        />
      )}
    </div>
  );
};

export default Toolbox;
