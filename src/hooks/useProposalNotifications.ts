
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationState {
  pendingCount: number;
  hasNewResponses: boolean;
}

export function useProposalNotifications(specialistId: string) {
  const [notifications, setNotifications] = useState<NotificationState>({
    pendingCount: 0,
    hasNewResponses: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!specialistId) return;

    // Fetch initial counts - only from active chat sessions
    const fetchCounts = async () => {
      try {
        const { data: pendingData, error: pendingError } = await supabase
          .from('appointment_proposals')
          .select(`
            id,
            chat_sessions!inner(status)
          `, { count: 'exact' })
          .eq('specialist_id', specialistId)
          .eq('status', 'pending')
          .in('chat_sessions.status', ['waiting', 'active'])
          .gt('expires_at', new Date().toISOString());

        if (pendingError) throw pendingError;

        setNotifications(prev => ({
          ...prev,
          pendingCount: pendingData?.length || 0
        }));
      } catch (error) {
        console.error('Error fetching proposal counts:', error);
      }
    };

    fetchCounts();

    // Set up real-time subscription for proposal changes
    const proposalChannel = supabase
      .channel('proposal-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_proposals',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('Proposal notification:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new?.status;
            const oldStatus = payload.old?.status;
            
            // User responded to proposal
            if (oldStatus === 'pending' && newStatus !== 'pending') {
              setNotifications(prev => ({
                ...prev,
                hasNewResponses: true,
                pendingCount: Math.max(0, prev.pendingCount - 1)
              }));

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('Proposal Response', {
                  body: `A user has ${newStatus} your appointment proposal`,
                  icon: '/favicon.ico'
                });
              }

              toast({
                title: newStatus === 'accepted' ? "Proposal Accepted! 🎉" : "Proposal Response",
                description: newStatus === 'accepted' 
                  ? "The appointment has been scheduled and added to your calendar!"
                  : `A user has ${newStatus} your appointment proposal`,
                variant: newStatus === 'accepted' ? 'default' : 'destructive'
              });
            }
          }
          
          // Refresh counts after any change
          fetchCounts();
        }
      )
      .subscribe();

    // Set up real-time subscription for new appointments created from accepted proposals
    const appointmentChannel = supabase
      .channel('appointment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'specialist_appointments',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('New appointment created:', payload);
          
          // Show notification for new appointment
          if (Notification.permission === 'granted') {
            new Notification('New Appointment Scheduled', {
              body: 'A new appointment has been added to your calendar',
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(proposalChannel);
      supabase.removeChannel(appointmentChannel);
    };
  }, [specialistId, toast]);

  const clearNewResponses = () => {
    setNotifications(prev => ({
      ...prev,
      hasNewResponses: false
    }));
  };

  return {
    ...notifications,
    clearNewResponses
  };
}
