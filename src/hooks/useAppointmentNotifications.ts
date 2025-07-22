
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AppointmentNotificationState {
  newAppointments: number;
  hasNewAppointments: boolean;
}

export function useAppointmentNotifications(specialistId?: string) {
  const [notifications, setNotifications] = useState<AppointmentNotificationState>({
    newAppointments: 0,
    hasNewAppointments: false
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for new appointments
    const channel = supabase
      .channel('appointment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'specialist_appointments',
          filter: specialistId ? `specialist_id=eq.${specialistId}` : undefined
        },
        (payload) => {
          console.log('New specialist appointment:', payload);
          
          setNotifications(prev => ({
            newAppointments: prev.newAppointments + 1,
            hasNewAppointments: true
          }));

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('New Appointment Scheduled', {
              body: 'A new appointment has been added to your calendar',
              icon: '/favicon.ico'
            });
          }

          toast({
            title: "New Appointment Scheduled",
            description: "A new appointment has been added to your calendar",
            duration: 10000
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scheduled_appointments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New scheduled appointment for user:', payload);
          
          toast({
            title: "Appointment Confirmed",
            description: "Your appointment has been scheduled successfully",
            duration: 8000
          });
        }
      )
      .subscribe();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, specialistId, toast]);

  const clearNewAppointments = () => {
    setNotifications(prev => ({
      ...prev,
      hasNewAppointments: false
    }));
  };

  return {
    ...notifications,
    clearNewAppointments
  };
}
