
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Edit, Bell, Calendar, Phone } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackingManager } from '@/utils/trackingManager';
import EditProfile from './EditProfile';
import NotificationSettings from './NotificationSettings';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

const UserProfile = ({ onNavigate }: UserProfileProps) => {
  const { t, language } = useLanguage();
  const [currentView, setCurrentView] = useState<'profile' | 'edit' | 'notifications'>('profile');
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const { userData, currentUser } = useUserData();
  
  // Get real-time tracking data
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
  
  const phoneNumber = localStorage.getItem('phoneNumber');
  const lastLogin = localStorage.getItem('lastLogin') || new Date().toDateString();
  
  // Helper function to format dates based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    if (language === 'es') {
      const monthKey = month.toLowerCase() as keyof typeof t;
      const translatedMonth = t(`profile.months.${monthKey}`) || month;
      return `${translatedMonth} ${year}`;
    }
    
    return `${month} ${year}`;
  };
  
  // Helper function to translate tool names
  const translateTool = (toolName: string) => {
    const toolMap: { [key: string]: string } = {
      'SteadySteel': t('profile.tools.steadySteel'),
      'Peer Chat': t('profile.tools.peerChat'),
      'The Foreman': t('profile.tools.foremanChat'),
      'Redline Recovery': t('profile.tools.urgeTracker'),
      'Gratitude Log': t('profile.tools.gratitudeLog'),
      'None yet': t('profile.tools.noneYet')
    };
    
    return toolMap[toolName] || toolName;
  };
  
  // Use real-time stats when available, fallback to userData
  const liveRecoveryStreak = realTimeStats?.currentStreak ?? userData?.toolboxStats?.streak ?? 0;
  const liveTotalToolsUsed = realTimeStats?.toolsUsedToday ?? userData?.toolboxStats?.totalSessions ?? 0;
  const liveActionsToday = realTimeStats?.actionsToday ?? 0;
  
  // Calculate weekly progress based on completed days this week
  const completedDays = userData?.journeyProgress?.completedDays || [];
  const currentWeekNumber = Math.ceil((completedDays.length > 0 ? Math.max(...completedDays) : 1) / 7);
  const weekStartDay = (currentWeekNumber - 1) * 7 + 1;
  const weekEndDay = currentWeekNumber * 7;
  
  // Count completed days in current week
  const weekCompletedDays = completedDays.filter(day => day >= weekStartDay && day <= weekEndDay).length;
  const weeklyProgressPercentage = Math.round((weekCompletedDays / 7) * 100);
  
  // Find most used tool from real-time activity tracking + activity log
  const activityLogToolUsage = userData?.activityLog?.reduce((acc: { [key: string]: number }, entry) => {
    if (entry.action.startsWith('Used ')) {
      const tool = entry.action.replace('Used ', '');
      acc[tool] = (acc[tool] || 0) + 1;
    }
    return acc;
  }, {}) || {};
  
  // Get today's tool usage from real-time stats
  const todaysToolActions = realTimeStats?.toolsUsedToday || 0;
  
  const mostUsedTool = Object.keys(activityLogToolUsage).length > 0 
    ? Object.entries(activityLogToolUsage).sort(([,a], [,b]) => b - a)[0][0] 
    : t('profile.tools.noneYet');

  const profileStats = [
    { 
      label: t('profile.recoveryStreak'), 
      value: liveRecoveryStreak, 
      unit: t('profile.days'), 
      color: "text-construction" 
    },
    { 
      label: t('profile.totalToolsUsed'), 
      value: liveTotalToolsUsed, 
      unit: t('profile.times'), 
      color: "text-construction" 
    },
    { 
      label: t('profile.actionsToday'), 
      value: liveActionsToday, 
      unit: t('profile.today'), 
      color: "text-construction" 
    }
  ];

  const user = {
    name: currentUser || "User",
    joinDate: formatDate("March 1, 2024"), // Could be calculated from userData creation date
    streakDays: liveRecoveryStreak,
    totalSessions: liveTotalToolsUsed,
    favoriteTools: mostUsedTool !== t('profile.tools.noneYet') ? [mostUsedTool, t('profile.tools.steadySteel'), t('profile.tools.peerChat')] : [t('profile.tools.steadySteel'), t('profile.tools.peerChat')],
    badges: [
      { name: t('profile.badges.weekWarrior'), earned: t('profile.earned', { time: '2 weeks ago' }), icon: "🏆" },
      { name: t('profile.badges.steadyBreather'), earned: t('profile.earned', { time: '1 week ago' }), icon: "🌬️" },
      { name: t('profile.badges.toolMaster'), earned: t('profile.earned', { time: '3 days ago' }), icon: "🧰" }
    ]
  };

  const handleAdminAccess = () => {
    const adminSequence = prompt("Enter admin access code:");
    if (adminSequence === "THRIVING2024") {
      onNavigate?.('admin-login');
    }
  };

  if (currentView === 'edit') {
    return <EditProfile onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'notifications') {
    return <NotificationSettings onBack={() => setCurrentView('profile')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">{t('profile.title').split(' ')[0]}</span><span className="font-fjalla font-extrabold italic">{t('profile.title').split(' ')[1]}</span>
          </h1>
          <p className="text-muted-foreground font-oswald">{t('profile.subtitle')}</p>
        </div>

      {/* Profile Card */}
      <Card className="bg-card mb-6 p-6 border-0 shadow-none">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <User className="text-primary-foreground" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-fjalla font-bold text-card-foreground text-xl">{user.name}</h2>
            <p className="text-muted-foreground font-source">{t('profile.memberSince', { date: user.joinDate })}</p>
            {phoneNumber && (
              <div className="flex items-center space-x-2 mt-1">
                <Phone size={14} className="text-muted-foreground" />
                <p className="text-muted-foreground text-sm font-source">{phoneNumber}</p>
              </div>
            )}
            <p className="text-muted-foreground text-sm font-source">{t('profile.lastLogin', { date: formatDate(lastLogin) })}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          {profileStats.map((stat, index) => (
            <div key={index}>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground font-source">{stat.unit}</div>
              <div className="text-xs text-muted-foreground font-source">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm font-source">{t('profile.mostUsedTool')}</span>
            <span className="text-primary font-fjalla font-medium">{translateTool(mostUsedTool)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm font-source">{t('profile.weeklyProgress')}</span>
            <span className="text-primary font-fjalla font-medium">{weeklyProgressPercentage}% ({weekCompletedDays}/7 {t('profile.days')})</span>
          </div>
        </div>
      </Card>

      {/* Favorite Tools */}
      <Card className="bg-card mb-6 p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">{t('profile.favorites')}</h3>
        <div className="flex flex-wrap gap-2">
          {user.favoriteTools.map((tool, index) => (
            <Badge key={index} className="bg-primary text-primary-foreground text-xs font-source">
              {tool}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Badges & Achievements */}
      <Card className="bg-card mb-6 p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">{t('profile.achievements')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {user.badges.map((badge, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span>{badge.icon}</span>
              </div>
              <div>
                <p className="text-card-foreground font-medium font-fjalla">{badge.name}</p>
                <p className="text-muted-foreground text-sm font-source">{badge.earned}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings */}
      <Card className="bg-card p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">{t('profile.settings')}</h3>
        <div className="space-y-3">
          <Button 
            onClick={() => setCurrentView('edit')}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <Edit size={16} className="mr-2" />
            {t('profile.editProfile')}
          </Button>
          <Button 
            onClick={() => setCurrentView('notifications')}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <Bell size={16} className="mr-2" />
            {t('profile.notificationSettings')}
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <Calendar size={16} className="mr-2" />
            {t('profile.weeklyCheckIn')}
          </Button>
        </div>
      </Card>

      {/* Hidden Admin Access */}
      <div className="mt-8">
        <Button
          onClick={handleAdminAccess}
          variant="ghost"
          className="w-full text-muted hover:text-muted-foreground opacity-10 hover:opacity-30 transition-opacity"
        >
          <Shield size={16} />
        </Button>
      </div>
      </div>
    </div>
  );
};

export default UserProfile;
