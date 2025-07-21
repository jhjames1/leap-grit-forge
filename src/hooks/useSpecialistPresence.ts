import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { updateSpecialistStatusFromCalendar } from '@/utils/calendarAvailability';

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

  // Fetch all specialist statuses with retry logic
  const fetchStatuses = async (retryCount = 0) => {
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
      
      // Type assertion for status field with fallback to offline for unknown states
      const typedData = (data || []).map(item => {
        let status = item.status as 'online' | 'away' | 'busy' | 'offline';
        
        // Handle unknown or invalid status values
        if (!['online', 'away', 'busy', 'offline'].includes(status)) {
          status = 'offline';
        }
        
        // Check if status is stale (no activity in last 5 minutes)
        const lastSeen = item.last_seen ? new Date(item.last_seen) : null;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (lastSeen && lastSeen < fiveMinutesAgo && status === 'online') {
          status = 'away';
        }
        
        return {
          ...item,
          status
        };
      });
      
      setSpecialistStatuses(typedData);
    } catch (error) {
      console.error('Error fetching specialist statuses:', error);
      
      // Retry up to 3 times with exponential backoff for network errors
      if (retryCount < 3 && (error?.message?.includes('Failed to fetch') || error?.message?.includes('network'))) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying specialist status fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchStatuses(retryCount + 1), delay);
        return;
      }
      
      // Set empty array on persistent error to prevent "unknown" displays
      setSpecialistStatuses([]);
    }
  };

  // Fetch analytics data with retry logic
  const fetchAnalytics = async (retryCount = 0) => {
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
      
      // Retry for network errors
      if (retryCount < 3 && (error?.message?.includes('Failed to fetch') || error?.message?.includes('network'))) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchAnalytics(retryCount + 1), delay);
        return;
      }
      
      // Set empty array on persistent error
      setAnalytics([]);
    }
  };

  // Enhanced presence tracking that syncs with calendar
  useEffect(() => {
    fetchStatuses();
    fetchAnalytics();
    setLoading(false);

    // Subscribe to specialist status changes
    const statusChannel = supabase
      .channel('specialist-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_status'
        },
        (payload) => {
          console.log('Specialist status changed:', payload);
          fetchStatuses();
        }
      )
      .subscribe();

    // Subscribe to chat session changes for analytics
    const sessionChannel = supabase
      .channel('chat-session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    // Set up presence tracking
    const presenceChannel = supabase.channel('specialist-presence');
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Specialist joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Specialist left:', key, leftPresences);
      })
      .subscribe();

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
            
            presenceChannel.track({
              specialist_id: data.id,
              online_at: new Date().toISOString(),
              status: 'online',
              calendar_aware: true
            });
          }
        });
    }

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(presenceChannel);
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
