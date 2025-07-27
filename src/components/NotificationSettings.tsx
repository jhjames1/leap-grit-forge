import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, Clock, Flame, MessageSquare, Calendar, TestTube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  onBack: () => void;
}

interface NotificationPreferences {
  dailyMotivation: boolean;
  motivationTime: string;
  streakAlerts: boolean;
  weeklyCheckIn: boolean;
  pushNotifications: boolean;
}

const NotificationSettings = ({ onBack }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyMotivation: true,
    motivationTime: '08:00',
    streakAlerts: true,
    weeklyCheckIn: true,
    pushNotifications: true
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing preferences from localStorage
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }

    // Check current push subscription status
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await pushNotificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('notificationPreferences', JSON.stringify(updated));

    // Handle push notification subscription changes
    if (key === 'pushNotifications') {
      setIsLoading(true);
      try {
        if (value) {
          const success = await pushNotificationService.subscribe();
          if (success) {
            setIsSubscribed(true);
          } else {
            // Revert the preference if subscription failed
            updated.pushNotifications = false;
            setPreferences(updated);
            localStorage.setItem('notificationPreferences', JSON.stringify(updated));
          }
        } else {
          await pushNotificationService.unsubscribe();
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Failed to update push notification preference:', error);
        toast({
          title: 'Error',
          description: 'Failed to update notification settings',
          variant: 'destructive'
        });
      }
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isSubscribed) {
      toast({
        title: 'Not Subscribed',
        description: 'Please enable push notifications first',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    await pushNotificationService.sendTestNotification();
    setIsLoading(false);
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
          <h1 className="text-5xl text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">NOTIFICATION</span><span className="font-fjalla font-extrabold italic">SETTINGS</span>
          </h1>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Daily Motivation */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">{t('notifications.dailyCheckIns')}</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-2 rounded-sm">
                  <Bell className="text-primary-foreground" size={16} />
                </div>
                <div>
                    <Label className="text-card-foreground font-medium">{t('notifications.morningCheckIn')}</Label>
                    <p className="text-muted-foreground text-sm">{t('notifications.morningCheckInDesc')}</p>
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
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">{t('notifications.recoverySupport')}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary p-2 rounded-sm">
                    <MessageSquare className="text-primary-foreground" size={16} />
                  </div>
                  <div>
                    <Label className="text-card-foreground font-medium">{t('notifications.peerMessages')}</Label>
                    <p className="text-muted-foreground text-sm">{t('notifications.peerMessagesDesc')}</p>
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
                    <Label className="text-card-foreground font-medium">{t('notifications.weeklyCheckIn')}</Label>
                    <p className="text-muted-foreground text-sm">{t('notifications.weeklyCheckInDesc')}</p>
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
            <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">{t('notifications.notificationMethod')}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary p-2 rounded-sm">
                    <Bell className="text-primary-foreground" size={16} />
                  </div>
                  <div>
                    <Label className="text-card-foreground font-medium">{t('notifications.pushNotifications')}</Label>
                    <p className="text-muted-foreground text-sm">
                      Web push notifications work on any device where you use this app
                    </p>
                    {isSubscribed && (
                      <p className="text-primary text-xs mt-1">✓ Active on this device</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={preferences.pushNotifications && isSubscribed}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  disabled={isLoading}
                />
              </div>

              {preferences.pushNotifications && isSubscribed && (
                <div className="ml-11 mt-3">
                  <Button
                    onClick={handleTestNotification}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <TestTube size={14} />
                    <span>Send Test Notification</span>
                  </Button>
                </div>
              )}

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