
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';

interface NotificationState {
  pendingCount: number;
  hasNewResponses: boolean;
}

export function useProposalNotifications(specialistId: string) {
  const [notifications, setNotifications] = useState<NotificationState>({
    pendingCount: 0,
    hasNewResponses: false
  });

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
        async (payload) => {
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

              // Send notification using unified service
              notificationService.sendNotification({
                title: 'Proposal Response',
                body: `A user has ${newStatus} your appointment proposal`,
                data: { 
                  type: 'proposal_response', 
                  proposalId: payload.new.id,
                  status: newStatus 
                }
              }).catch(error => console.error('Failed to send notification:', error));
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
        async (payload) => {
          console.log('New appointment created:', payload);
          
          // Send notification using unified service
          notificationService.sendNotification({
            title: 'New Appointment Scheduled',
            body: 'A new appointment has been added to your calendar',
            data: { 
              type: 'appointment_created', 
              appointmentId: payload.new.id 
            }
          }).catch(error => console.error('Failed to send notification:', error));
        }
      )
      .subscribe();

    // Request notification permission on first load
    notificationService.requestPermissions();

    return () => {
      supabase.removeChannel(proposalChannel);
      supabase.removeChannel(appointmentChannel);
    };
  }, [specialistId]);

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
