
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, Clock, Flame, MessageSquare, Calendar } from 'lucide-react';

interface NotificationSettingsProps {
  onBack: () => void;
}

interface NotificationPreferences {
  dailyMotivation: boolean;
  motivationTime: string;
  streakAlerts: boolean;
  weeklyCheckIn: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

const NotificationSettings = ({ onBack }: NotificationSettingsProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyMotivation: true,
    motivationTime: '08:00',
    streakAlerts: true,
    weeklyCheckIn: true,
    pushNotifications: true,
    smsNotifications: false
  });

  useEffect(() => {
    // Load existing preferences from localStorage
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('notificationPreferences', JSON.stringify(updated));
  };

  const timeOptions = [
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-steel-light hover:text-white mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          <span className="font-oswald font-extralight tracking-tight">NOTIFICATION</span><span className="font-fjalla font-extrabold italic">SETTINGS</span>
        </h1>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Daily Motivation */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-construction/20 p-2 rounded-lg">
                <Bell className="text-construction" size={16} />
              </div>
              <div>
                <Label className="text-white font-oswald font-medium">Daily Motivation</Label>
                <p className="text-steel-light text-sm">Receive daily motivational quotes</p>
              </div>
            </div>
            <Switch
              checked={preferences.dailyMotivation}
              onCheckedChange={(checked) => updatePreference('dailyMotivation', checked)}
            />
          </div>
          
          {preferences.dailyMotivation && (
            <div className="ml-11 space-y-2">
              <Label className="text-steel-light text-sm flex items-center space-x-2">
                <Clock size={14} />
                <span>Reminder Time</span>
              </Label>
              <Select value={preferences.motivationTime} onValueChange={(value) => updatePreference('motivationTime', value)}>
                <SelectTrigger className="bg-steel-dark/50 border-steel text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        {/* Streak Alerts */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-construction/20 p-2 rounded-lg">
                <Flame className="text-construction" size={16} />
              </div>
              <div>
                <Label className="text-white font-oswald font-medium">Streak Alerts</Label>
                <p className="text-steel-light text-sm">Get notified before losing your streak</p>
              </div>
            </div>
            <Switch
              checked={preferences.streakAlerts}
              onCheckedChange={(checked) => updatePreference('streakAlerts', checked)}
            />
          </div>
        </Card>

        {/* Weekly Check-in */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-construction/20 p-2 rounded-lg">
                <Calendar className="text-construction" size={16} />
              </div>
              <div>
                <Label className="text-white font-oswald font-medium">Weekly Check-in Reminders</Label>
                <p className="text-steel-light text-sm">Reminders for scheduled peer check-ins</p>
              </div>
            </div>
            <Switch
              checked={preferences.weeklyCheckIn}
              onCheckedChange={(checked) => updatePreference('weeklyCheckIn', checked)}
            />
          </div>
        </Card>

        {/* Notification Method */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <h3 className="text-white font-oswald font-medium mb-4">Notification Method</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-steel/20 p-2 rounded-lg">
                  <Bell className="text-steel-light" size={16} />
                </div>
                <div>
                  <Label className="text-white font-medium">Push Notifications</Label>
                  <p className="text-steel-light text-sm">In-app notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-steel/20 p-2 rounded-lg">
                  <MessageSquare className="text-steel-light" size={16} />
                </div>
                <div>
                  <Label className="text-white font-medium">SMS Notifications</Label>
                  <p className="text-steel-light text-sm">Text message alerts</p>
                </div>
              </div>
              <Switch
                checked={preferences.smsNotifications}
                onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
              />
            </div>
          </div>
        </Card>

        <Button 
          onClick={onBack}
          className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
        >
          Save Settings
        </Button>
      </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
