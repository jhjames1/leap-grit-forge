
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Edit, Bell, Calendar, Phone } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import EditProfile from './EditProfile';
import NotificationSettings from './NotificationSettings';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

const UserProfile = ({ onNavigate }: UserProfileProps) => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<'profile' | 'edit' | 'notifications'>('profile');
  const { userData, currentUser } = useUserData();
  
  const phoneNumber = localStorage.getItem('phoneNumber');
  const lastLogin = localStorage.getItem('lastLogin') || new Date().toDateString();
  
  // Calculate user stats from real data
  const recoveryStreak = userData?.toolboxStats?.streak || 0;
  const totalToolsUsed = userData?.toolboxStats?.totalSessions || 0;
  const urgesTracked = userData?.toolboxStats?.urgesThisWeek || 0;
  
  // Find most used tool from activity log
  const toolUsage = userData?.activityLog?.reduce((acc: { [key: string]: number }, entry) => {
    if (entry.action.startsWith('Used ')) {
      const tool = entry.action.replace('Used ', '');
      acc[tool] = (acc[tool] || 0) + 1;
    }
    return acc;
  }, {}) || {};
  
  const mostUsedTool = Object.keys(toolUsage).length > 0 
    ? Object.entries(toolUsage).sort(([,a], [,b]) => b - a)[0][0] 
    : 'None yet';

  const profileStats = [
    { label: t('profile.recoveryStreak'), value: recoveryStreak, unit: t('profile.days'), color: "text-construction" },
    { label: t('profile.totalToolsUsed'), value: totalToolsUsed, unit: t('profile.times'), color: "text-construction" },
    { label: t('profile.urgesTracked'), value: urgesTracked, unit: t('profile.thisWeek'), color: "text-construction" }
  ];

  const user = {
    name: currentUser || "User",
    joinDate: "March 2024", // Could be calculated from userData creation date
    streakDays: recoveryStreak,
    totalSessions: totalToolsUsed,
    favoriteTools: mostUsedTool !== 'None yet' ? [mostUsedTool, "SteadySteel", "Peer Chat"] : ["SteadySteel", "Peer Chat"],
    badges: [
      { name: "Week Warrior", earned: t('profile.earned', { time: '2 weeks ago' }), icon: "🏆" },
      { name: "Steady Breather", earned: t('profile.earned', { time: '1 week ago' }), icon: "🌬️" },
      { name: "Tool Master", earned: t('profile.earned', { time: '3 days ago' }), icon: "🧰" }
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
    <div className="p-4 pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          {t('profile.title')}
        </h1>
        <p className="text-steel-light font-oswald">{t('profile.subtitle')}</p>
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
            <p className="text-muted-foreground text-sm font-source">{t('profile.lastLogin', { date: lastLogin })}</p>
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
            <span className="text-primary font-fjalla font-medium">{mostUsedTool}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm font-source">{t('profile.weeklyProgress')}</span>
            <span className="text-primary font-fjalla font-medium">{Math.round((urgesTracked / 7) * 100)}{t('profile.tracked')}</span>
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
  );
};

export default UserProfile;
