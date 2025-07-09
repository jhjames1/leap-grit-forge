import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, Clock, Flame, MessageSquare, Calendar, Smartphone } from 'lucide-react';

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
            className="text-muted-foreground hover:text-foreground mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">NOTIFICATION</span><span className="font-fjalla font-extrabold italic">SETTINGS</span>
          </h1>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Daily Motivation */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">Daily Check-ins</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-2 rounded-sm">
                  <Bell className="text-primary-foreground" size={16} />
                </div>
                <div>
                  <Label className="text-card-foreground font-medium">Morning Check-in</Label>
                  <p className="text-muted-foreground text-sm">Get reminded to start your day right</p>
                </div>
              </div>
              <Switch
                checked={preferences.dailyMotivation}
                onCheckedChange={(checked) => updatePreference('dailyMotivation', checked)}
              />
            </div>
            
            {preferences.dailyMotivation && (
              <div className="mt-4 ml-11 space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center space-x-2">
                  <Clock size={14} />
                  <span>Reminder Time</span>
                </Label>
                <Select value={preferences.motivationTime} onValueChange={(value) => updatePreference('motivationTime', value)}>
                  <SelectTrigger className="bg-card border border-border text-card-foreground">
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

          {/* Recovery Support */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">Recovery Support</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary p-2 rounded-sm">
                    <MessageSquare className="text-primary-foreground" size={16} />
                  </div>
                  <div>
                    <Label className="text-card-foreground font-medium">Peer Messages</Label>
                    <p className="text-muted-foreground text-sm">Notifications from peer specialists</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.streakAlerts}
                  onCheckedChange={(checked) => updatePreference('streakAlerts', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Weekly Progress */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">Weekly Progress</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-2 rounded-sm">
                  <Calendar className="text-primary-foreground" size={16} />
                </div>
                <div>
                  <Label className="text-card-foreground font-medium">Weekly Check-in</Label>
                  <p className="text-muted-foreground text-sm">Review your progress and set goals</p>
                </div>
              </div>
              <Switch
                checked={preferences.weeklyCheckIn}
                onCheckedChange={(checked) => updatePreference('weeklyCheckIn', checked)}
              />
            </div>
          </Card>

          {/* Notification Method */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">Notification Method</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary p-2 rounded-sm">
                    <Bell className="text-primary-foreground" size={16} />
                  </div>
                  <div>
                    <Label className="text-card-foreground font-medium">Push Notifications</Label>
                    <p className="text-muted-foreground text-sm">Receive notifications on this device</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary p-2 rounded-sm">
                    <Smartphone className="text-primary-foreground" size={16} />
                  </div>
                  <div>
                    <Label className="text-card-foreground font-medium">SMS Notifications</Label>
                    <p className="text-muted-foreground text-sm">Text message alerts and reminders</p>
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-fjalla font-bold"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;