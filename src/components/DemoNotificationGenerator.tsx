import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const DemoNotificationGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateDemoNotifications = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate demo notifications.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const demoNotifications = [
        {
          user_id: user.id,
          title: "Welcome to LEAP!",
          body: "Thanks for joining us on your recovery journey. We're here to support you every step of the way.",
          notification_type: "welcome",
          data: {},
          is_read: false
        },
        {
          user_id: user.id,
          title: "Badge Earned: First Steps",
          body: "Congratulations! You've earned your first badge for completing your initial session.",
          notification_type: "badge_earned",
          data: { badge: "first_steps" },
          is_read: false
        },
        {
          user_id: user.id,
          title: "Appointment Confirmed",
          body: "Your session with Sarah Johnson has been confirmed for tomorrow at 2:00 PM.",
          notification_type: "appointment_confirmed",
          data: { 
            specialist: "Sarah Johnson", 
            date: "2024-07-28", 
            time: "14:00" 
          },
          is_read: false
        },
        {
          user_id: user.id,
          title: "Weekly Progress Update",
          body: "Great work this week! You've completed 5 out of 7 days. Keep up the momentum!",
          notification_type: "weekly_progress",
          data: { 
            completed_days: 5, 
            total_days: 7 
          },
          is_read: true
        },
        {
          user_id: user.id,
          title: "New Message from Foreman",
          body: "You have a new personalized message waiting for you in the Foreman chat.",
          notification_type: "new_message",
          data: { source: "foreman" },
          is_read: true
        },
        {
          user_id: user.id,
          title: "Daily Reminder",
          body: "Don't forget to check in with your recovery tools today. You've got this!",
          notification_type: "reminder",
          data: { type: "daily_checkin" },
          is_read: true
        }
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(demoNotifications);

      if (error) throw error;

      toast({
        title: "Demo Notifications Created",
        description: "Successfully created 6 demo notifications to test the functionality.",
      });
    } catch (error) {
      console.error('Error creating demo notifications:', error);
      toast({
        title: "Error",
        description: "Failed to create demo notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-4 m-4">
        <p className="text-center text-muted-foreground">
          Please sign in to generate demo notifications.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 m-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Demo Notification Generator</h3>
        <p className="text-sm text-muted-foreground">
          Click the button below to create sample notifications for testing the notification system.
        </p>
        <Button 
          onClick={generateDemoNotifications}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Demo Notifications"}
        </Button>
      </div>
    </Card>
  );
};