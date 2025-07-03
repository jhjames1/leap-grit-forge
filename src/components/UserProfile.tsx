
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield } from 'lucide-react';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

const UserProfile = ({ onNavigate }: UserProfileProps) => {
  const [user] = useState({
    name: "Jake M.",
    joinDate: "March 2024",
    streakDays: 23,
    totalSessions: 142,
    favoriteTools: ["SteadySteel", "The Foreman", "Peer Chat"],
    badges: [
      { name: "Week Warrior", earned: "2 weeks ago", icon: "🏆" },
      { name: "Steady Breather", earned: "1 week ago", icon: "🌬️" },
      { name: "Tool Master", earned: "3 days ago", icon: "🧰" }
    ]
  });

  const profileStats = [
    { label: "Recovery Streak", value: user.streakDays, unit: "days", color: "text-construction" },
    { label: "Total Sessions", value: user.totalSessions, unit: "times", color: "text-construction" },
    { label: "Tools Mastered", value: user.favoriteTools.length, unit: "tools", color: "text-construction" }
  ];

  const handleAdminAccess = () => {
    // Check for admin access sequence or special key combination
    const adminSequence = prompt("Enter admin access code:");
    if (adminSequence === "THRIVING2024") {
      onNavigate?.('admin-login');
    }
  };

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
          <div>
            <h2 className="font-oswald font-bold text-white text-xl">{user.name}</h2>
            <p className="text-steel-light">Member since {user.joinDate}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          {profileStats.map((stat, index) => (
            <div key={index}>
              <div className={`text-2xl font-anton ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-steel-light font-oswald">{stat.unit}</div>
              <div className="text-xs text-steel-light">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Favorite Tools */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4">Favorite Tools</h3>
        <div className="flex space-x-3">
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
          <Button variant="outline" className="w-full border-steel text-steel-light hover:bg-steel/10">
            Edit Profile
          </Button>
          <Button variant="outline" className="w-full border-steel text-steel-light hover:bg-steel/10">
            Notifications
          </Button>
          <Button variant="outline" className="w-full border-steel text-steel-light hover:bg-steel/10">
            Privacy
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
