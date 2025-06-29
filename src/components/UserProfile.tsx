
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Settings, 
  Trophy, 
  Target, 
  Bell, 
  Shield, 
  HelpCircle,
  LogOut,
  Edit3,
  Calendar,
  Flame
} from 'lucide-react';

const UserProfile = () => {
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const achievements = [
    { name: '3-Week Warrior', date: '2 days ago', icon: Trophy, color: 'bg-construction' },
    { name: 'First Check-in', date: '1 week ago', icon: Target, color: 'bg-steel' },
    { name: 'Tool Master', date: '2 weeks ago', icon: Settings, color: 'bg-green-600' },
  ];

  const stats = [
    { label: 'Recovery Streak', value: '23 days', icon: Flame, color: 'text-construction' },
    { label: 'Modules Completed', value: '23/90', icon: Target, color: 'text-steel-light' },
    { label: 'Peer Messages', value: '47', icon: User, color: 'text-blue-400' },
    { label: 'Tools Used', value: '142', icon: Settings, color: 'text-green-400' },
  ];

  return (
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-anton text-3xl text-white mb-2">Profile</h1>
        <p className="text-steel-light font-oswald">Your recovery journey</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-construction rounded-full flex items-center justify-center">
            <User className="text-midnight" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-oswald font-bold text-white text-xl">Recovery Warrior</h2>
            <p className="text-steel-light">Started journey 23 days ago</p>
            <Badge className="bg-construction text-midnight font-oswald font-medium mt-2">
              Active Member
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="border-steel text-steel-light">
            <Edit3 size={16} />
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
              <div className="flex items-center space-x-3">
                <Icon className={stat.color} size={20} />
                <div>
                  <div className={`font-anton text-lg ${stat.color}`}>{stat.value}</div>
                  <div className="text-steel-light text-xs font-oswald">{stat.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Achievements */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4 flex items-center">
          <Trophy className="mr-2 text-construction" size={20} />
          Recent Achievements
        </h3>
        <div className="space-y-3">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className={`p-2 rounded-lg ${achievement.color}`}>
                  <Icon className="text-white" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{achievement.name}</p>
                  <p className="text-steel-light text-sm">Earned {achievement.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Settings */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4 flex items-center">
          <Settings className="mr-2 text-steel-light" size={20} />
          Settings
        </h3>
        
        <div className="space-y-4">
          {/* Anonymous Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="text-steel-light" size={16} />
              <div>
                <p className="text-white font-medium">Anonymous Mode</p>
                <p className="text-steel-light text-sm">Hide your identity in community features</p>
              </div>
            </div>
            <Switch 
              checked={anonymousMode} 
              onCheckedChange={setAnonymousMode}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="text-steel-light" size={16} />
              <div>
                <p className="text-white font-medium">Notifications</p>
                <p className="text-steel-light text-sm">Daily reminders and peer messages</p>
              </div>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button className="w-full bg-steel hover:bg-steel-light text-white font-oswald font-semibold py-3 rounded-lg flex items-center justify-center">
          <HelpCircle className="mr-2" size={20} />
          Help & Support
        </Button>
        
        <Button variant="outline" className="w-full border-red-600 text-red-400 hover:bg-red-600/10 font-oswald font-semibold py-3 rounded-lg flex items-center justify-center">
          <LogOut className="mr-2" size={20} />
          Sign Out
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-steel-light text-sm font-oswald">
          LEAP by Thriving United
        </p>
        <p className="text-steel-light text-xs mt-1">
          Your recovery. Your terms.
        </p>
      </div>
    </div>
  );
};

export default UserProfile;
