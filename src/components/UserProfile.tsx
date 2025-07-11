
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Edit, Bell, Calendar, Phone, BookOpen, LogOut } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { trackingManager } from '@/utils/trackingManager';
import EditProfile from './EditProfile';
import NotificationSettings from './NotificationSettings';
import { SavedWisdom } from './SavedWisdom';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

const UserProfile = ({ onNavigate }: UserProfileProps) => {
  const { t, language } = useLanguage();
  const [currentView, setCurrentView] = useState<'profile' | 'edit' | 'notifications' | 'saved-wisdom'>('profile');
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const { userData, currentUser } = useUserData();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.('home');
  };
  
  // Get real-time tracking data for all metrics
  useEffect(() => {
    const updateStats = () => {
      try {
        const liveStats = trackingManager.getTodaysStats();
        const streakData = trackingManager.getStreakData();
        setRealTimeStats({ 
          ...liveStats, 
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          urgesTracked: userData?.toolboxStats?.urgesThisWeek || 0
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
  const liveTotalToolsUsed = realTimeStats?.totalToolsUsed ?? userData?.toolboxStats?.totalSessions ?? 0;
  const liveActionsToday = realTimeStats?.actionsToday ?? 0;
  const liveUrgesTracked = realTimeStats?.urgesTracked ?? userData?.toolboxStats?.urgesThisWeek ?? 0;
  
  // Calculate real-time weekly progress
  const getWeeklyProgress = () => {
    // Fallback calculation using journey progress
    const completedDays = userData?.journeyProgress?.completedDays || [];
    const currentWeekNumber = Math.ceil((completedDays.length > 0 ? Math.max(...completedDays) : 1) / 7);
    const weekStartDay = (currentWeekNumber - 1) * 7 + 1;
    const weekEndDay = currentWeekNumber * 7;
    
    return completedDays.filter(day => day >= weekStartDay && day <= weekEndDay).length;
  };
  
  const weekCompletedDays = getWeeklyProgress();
  const weeklyProgressPercentage = Math.round((weekCompletedDays / 7) * 100);
  
  // Get real-time favorite tools based on actual usage
  const getFavoriteTools = () => {
    if (!userData?.activityLog) return [t('profile.tools.steadySteel'), t('profile.tools.peerChat'), t('profile.tools.foremanChat')];
    
    // Count tool usage from activity log (completed actions)
    const toolCounts = userData.activityLog.reduce((acc: { [key: string]: number }, entry) => {
      if (entry.action.includes('Completed')) {
        let tool = '';
        if (entry.action.includes('SteadySteel')) tool = 'SteadySteel';
        else if (entry.action.includes('Redline Recovery')) tool = 'Redline Recovery';
        else if (entry.action.includes('Gratitude')) tool = 'Gratitude Log';
        else if (entry.action.includes('Foreman')) tool = 'The Foreman';
        
        if (tool) {
          acc[tool] = (acc[tool] || 0) + 1;
        }
      }
      return acc;
    }, {});
    
    // Get top 3 most used tools
    const sortedTools = Object.entries(toolCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tool]) => translateTool(tool));
    
    // If less than 3 tools used, add defaults
    const defaultTools = [t('profile.tools.steadySteel'), t('profile.tools.peerChat'), t('profile.tools.foremanChat')];
    const favorites = [...sortedTools];
    
    defaultTools.forEach(tool => {
      if (favorites.length < 3 && !favorites.includes(tool)) {
        favorites.push(tool);
      }
    });
    
    return favorites.slice(0, 3);
  };

  const profileStats = [
    { 
      label: "Streak", 
      value: liveRecoveryStreak, 
      unit: "", 
      color: "text-construction" 
    },
    { 
      label: "Tools Used", 
      value: liveTotalToolsUsed, 
      unit: "", 
      color: "text-construction" 
    },
    { 
      label: "Actions\nToday", 
      value: liveActionsToday, 
      unit: "", 
      color: "text-construction" 
    }
  ];

  const user = {
    name: currentUser || "User",
    joinDate: formatDate("March 1, 2024"), // Could be calculated from userData creation date
    streakDays: liveRecoveryStreak,
    totalSessions: liveTotalToolsUsed,
    favoriteTools: getFavoriteTools(),
    badges: [
      { name: t('profile.badges.weekWarrior'), earned: t('profile.earned', { time: '2 weeks ago' }), icon: "🏆" },
      { name: t('profile.badges.steadyBreather'), earned: t('profile.earned', { time: '1 week ago' }), icon: "🌬️" },
      { name: t('profile.badges.toolMaster'), earned: t('profile.earned', { time: '3 days ago' }), icon: "🧰" }
    ]
  };


  if (currentView === 'edit') {
    return <EditProfile onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'notifications') {
    return <NotificationSettings onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'saved-wisdom') {
    return <SavedWisdom onBack={() => setCurrentView('profile')} />;
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

        {/* Sign Out Button */}
        <div className="mb-4">
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
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
              <div className="text-xs text-muted-foreground font-source whitespace-pre-line">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
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
            onClick={() => setCurrentView('saved-wisdom')}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <BookOpen size={16} className="mr-2" />
            {t('toolbox.savedWisdom.title')}
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

      </div>
    </div>
  );
};

export default UserProfile;
