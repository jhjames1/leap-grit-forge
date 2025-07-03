
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Edit, Bell, Calendar, Phone } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import EditProfile from './EditProfile';
import NotificationSettings from './NotificationSettings';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

const UserProfile = ({ onNavigate }: UserProfileProps) => {
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
    { label: "Recovery Streak", value: recoveryStreak, unit: "days", color: "text-construction" },
    { label: "Total Tools Used", value: totalToolsUsed, unit: "times", color: "text-construction" },
    { label: "Urges Tracked", value: urgesTracked, unit: "this week", color: "text-construction" }
  ];

  const user = {
    name: currentUser || "User",
    joinDate: "March 2024", // Could be calculated from userData creation date
    streakDays: recoveryStreak,
    totalSessions: totalToolsUsed,
    favoriteTools: mostUsedTool !== 'None yet' ? [mostUsedTool, "SteadySteel", "Peer Chat"] : ["SteadySteel", "Peer Chat"],
    badges: [
      { name: "Week Warrior", earned: "2 weeks ago", icon: "🏆" },
      { name: "Steady Breather", earned: "1 week ago", icon: "🌬️" },
      { name: "Tool Master", earned: "3 days ago", icon: "🧰" }
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
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-anton text-3xl text-white mb-2">Your Profile</h1>
        <p className="text-steel-light font-oswald">Track your progress and achievements</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-construction rounded-full flex items-center justify-center">
            <User className="text-midnight" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-oswald font-bold text-white text-xl">{user.name}</h2>
            <p className="text-steel-light">Member since {user.joinDate}</p>
            {phoneNumber && (
              <div className="flex items-center space-x-2 mt-1">
                <Phone size={14} className="text-steel-light" />
                <p className="text-steel-light text-sm">{phoneNumber}</p>
              </div>
            )}
            <p className="text-steel-light text-sm">Last login: {lastLogin}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          {profileStats.map((stat, index) => (
            <div key={index}>
              <div className={`text-2xl font-anton ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-steel-light font-oswald">{stat.unit}</div>
              <div className="text-xs text-steel-light">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-steel-dark/50">
          <div className="flex justify-between items-center">
            <span className="text-steel-light text-sm">Most Used Tool:</span>
            <span className="text-construction font-oswald font-medium">{mostUsedTool}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-steel-light text-sm">Weekly Progress:</span>
            <span className="text-construction font-oswald font-medium">{Math.round((urgesTracked / 7) * 100)}% tracked</span>
          </div>
        </div>
      </Card>

      {/* Favorite Tools */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4">Favorite Tools</h3>
        <div className="flex flex-wrap gap-2">
          {user.favoriteTools.map((tool, index) => (
            <Badge key={index} className="bg-construction text-midnight text-xs font-oswald">
              {tool}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Badges & Achievements */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4">Achievements</h3>
        <div className="grid grid-cols-2 gap-4">
          {user.badges.map((badge, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-steel-dark/20 rounded-lg">
              <div className="w-8 h-8 bg-steel rounded-full flex items-center justify-center">
                <span>{badge.icon}</span>
              </div>
              <div>
                <p className="text-white font-medium">{badge.name}</p>
                <p className="text-steel-light text-sm">Earned {badge.earned}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
        <h3 className="font-oswald font-semibold text-white mb-4">Settings</h3>
        <div className="space-y-3">
          <Button 
            onClick={() => setCurrentView('edit')}
            variant="outline" 
            className="w-full border-steel text-steel-light hover:bg-steel/10 justify-start"
          >
            <Edit size={16} className="mr-2" />
            Edit Profile
          </Button>
          <Button 
            onClick={() => setCurrentView('notifications')}
            variant="outline" 
            className="w-full border-steel text-steel-light hover:bg-steel/10 justify-start"
          >
            <Bell size={16} className="mr-2" />
            Notification Settings
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-steel text-steel-light hover:bg-steel/10 justify-start"
          >
            <Calendar size={16} className="mr-2" />
            Weekly Check-In Schedule
          </Button>
        </div>
      </Card>

      {/* Hidden Admin Access */}
      <div className="mt-8">
        <Button
          onClick={handleAdminAccess}
          variant="ghost"
          className="w-full text-steel-dark hover:text-steel opacity-10 hover:opacity-30 transition-opacity"
        >
          <Shield size={16} />
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
