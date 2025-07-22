import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { updateSpecialistStatusFromCalendar } from '@/utils/calendarAvailability';
import { realtimeService, RealtimeEventHandler } from '@/services/realtimeService';

interface SpecialistStatus {
  id: string;
  specialist_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string | null;
  status_message: string | null;
  presence_data: any;
}

interface SpecialistAnalytics {
  specialist_id: string;
  total_sessions: number;
  active_sessions: number;
  avg_response_time: number;
  total_messages: number;
  last_activity: string;
}

export const useSpecialistPresence = () => {
  const { user } = useAuth();
  const [specialistStatuses, setSpecialistStatuses] = useState<SpecialistStatus[]>([]);
  const [analytics, setAnalytics] = useState<SpecialistAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRefs = useRef<string[]>([]);

  // Enhanced update status function that considers calendar availability
  const updateStatus = async (status: 'online' | 'away' | 'busy' | 'offline', message?: string) => {
    if (!user) return;

    try {
      // Get specialist record
      const { data: specialist } = await supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      // If setting to online, check calendar availability first
      if (status === 'online') {
        await updateSpecialistStatusFromCalendar(specialist.id);
      } else {
        // For other statuses, update directly with manual override
        await supabase
          .from('specialist_status')
          .upsert({
            specialist_id: specialist.id,
            status,
            status_message: message || null,
            last_seen: new Date().toISOString(),
            presence_data: {
              calendar_controlled: false,
              manual_override: true,
              browser: navigator.userAgent,
              timestamp: Date.now(),
              activity: 'manual_status_change'
            }
          });
      }
    } catch (error) {
      console.error('Error updating specialist status:', error);
    }
  };

  // Track specialist analytics
  const trackActivity = async (activity: string, metadata?: any) => {
    if (!user) return;

    try {
      const { data: specialist } = await supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      // Update presence data with activity
      await supabase
        .from('specialist_status')
        .update({
          last_seen: new Date().toISOString(),
          presence_data: {
            browser: navigator.userAgent,
            timestamp: Date.now(),
            activity,
            metadata
          }
        })
        .eq('specialist_id', specialist.id);
    } catch (error) {
      console.error('Error tracking specialist activity:', error);
    }
  };

  // Fetch all specialist statuses
  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_status')
        .select(`
          *,
          peer_specialists (
            first_name,
            last_name,
            specialties
          )
        `);

      if (error) throw error;
      
      // Type assertion for status field
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'online' | 'away' | 'busy' | 'offline'
      }));
      
      setSpecialistStatuses(typedData);
    } catch (error) {
      console.error('Error fetching specialist statuses:', error);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      // Get chat session analytics
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          specialist_id,
          status,
          started_at,
          ended_at,
          chat_messages (
            id,
            created_at,
            sender_type
          )
        `);

      if (sessions) {
        const analyticsMap = new Map<string, SpecialistAnalytics>();

        sessions.forEach(session => {
          if (!session.specialist_id) return;

          const existing = analyticsMap.get(session.specialist_id) || {
            specialist_id: session.specialist_id,
            total_sessions: 0,
            active_sessions: 0,
            avg_response_time: 0,
            total_messages: 0,
            last_activity: ''
          };

          existing.total_sessions++;
          if (session.status === 'active') existing.active_sessions++;
          
          const messages = session.chat_messages || [];
          existing.total_messages += messages.length;
          
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (!existing.last_activity || lastMessage.created_at > existing.last_activity) {
              existing.last_activity = lastMessage.created_at;
            }
          }

          analyticsMap.set(session.specialist_id, existing);
        });

        setAnalytics(Array.from(analyticsMap.values()));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Enhanced presence tracking that syncs with calendar using centralized service
  useEffect(() => {
    fetchStatuses();
    fetchAnalytics();
    setLoading(false);

    // Handler for status changes
    const handleStatusChange: RealtimeEventHandler = (payload) => {
      console.log('Specialist status changed:', payload);
      fetchStatuses();
    };
    
    // Handler for session analytics
    const handleSessionChange: RealtimeEventHandler = () => {
      fetchAnalytics();
    };

    // Subscribe to specialist status changes
    const statusSubscriptionId = realtimeService.subscribe(
      'specialist-status-changes',
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'specialist_status'
      },
      handleStatusChange
    );

    // Subscribe to chat session changes for analytics
    const sessionSubscriptionId = realtimeService.subscribe(
      'chat-session-changes',
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      },
      handleSessionChange
    );

    // Set up presence tracking using centralized service
    const presenceJoinHandler: RealtimeEventHandler = ({ key, newPresences }) => {
      console.log('Specialist joined:', key, newPresences);
    };
    
    const presenceLeaveHandler: RealtimeEventHandler = ({ key, leftPresences }) => {
      console.log('Specialist left:', key, leftPresences);
    };
    
    const presenceSyncHandler: RealtimeEventHandler = (payload) => {
      console.log('Presence sync:', payload);
    };
    
    const presenceJoinId = realtimeService.subscribe(
      'specialist-presence',
      'presence',
      { event: 'join' },
      presenceJoinHandler
    );
    
    const presenceLeaveId = realtimeService.subscribe(
      'specialist-presence',
      'presence',
      { event: 'leave' },
      presenceLeaveHandler
    );
    
    const presenceSyncId = realtimeService.subscribe(
      'specialist-presence',
      'presence',
      { event: 'sync' },
      presenceSyncHandler
    );

    subscriptionRefs.current = [
      statusSubscriptionId, 
      sessionSubscriptionId, 
      presenceJoinId, 
      presenceLeaveId, 
      presenceSyncId
    ];

    // Track current user's presence if they're a specialist
    if (user) {
      supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            // Initialize with calendar-based status
            updateSpecialistStatusFromCalendar(data.id);
          }
        });
    }

    return () => {
      subscriptionRefs.current.forEach(subscriptionId => {
        realtimeService.unsubscribe(subscriptionId, () => {});
      });
      subscriptionRefs.current = [];
    };
  }, [user]);

  // Update presence on activity
  useEffect(() => {
    const handleActivity = () => {
      trackActivity('user_activity');
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Set user offline on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateStatus('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    specialistStatuses,
    analytics,
    loading,
    updateStatus,
    trackActivity,
    refreshData: () => {
      fetchStatuses();
      fetchAnalytics();
    }
  };
};
