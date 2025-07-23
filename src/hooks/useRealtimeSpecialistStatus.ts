import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type SpecialistStatus = 'online' | 'away' | 'offline' | 'busy';

interface SpecialistStatusData {
  status: SpecialistStatus;
  status_message?: string | null;
  last_seen?: string;
  updated_at?: string;
}

export const useRealtimeSpecialistStatus = (specialistId?: string) => {
  const [statusData, setStatusData] = useState<SpecialistStatusData>({
    status: 'offline'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    if (!specialistId) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('specialist_status')
        .select('status, status_message, last_seen, updated_at')
        .eq('specialist_id', specialistId)
        .single();

      if (fetchError) {
        // If no status record exists, default to offline
        if (fetchError.code === 'PGRST116') {
          setStatusData({ status: 'offline' });
        } else {
          throw fetchError;
        }
      } else {
        setStatusData({
          status: data.status as SpecialistStatus,
          status_message: data.status_message,
          last_seen: data.last_seen,
          updated_at: data.updated_at
        });
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch specialist status';
      logger.error('Error fetching specialist status', err);
      setError(errorMessage);
      // Set offline as fallback
      setStatusData({ status: 'offline' });
    } finally {
      setLoading(false);
    }
  }, [specialistId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!specialistId) return;

    // Fetch initial status
    fetchStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`specialist_status_${specialistId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'specialist_status',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          logger.debug('Real-time specialist status update received', payload);
          
          if (payload.eventType === 'DELETE') {
            // If status record is deleted, set to offline
            setStatusData({ status: 'offline' });
          } else if (payload.new) {
            // Update with new status data
            setStatusData({
              status: payload.new.status as SpecialistStatus,
              status_message: payload.new.status_message,
              last_seen: payload.new.last_seen,
              updated_at: payload.new.updated_at
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug(`Subscribed to specialist status updates for ${specialistId}`);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Failed to subscribe to specialist status updates');
          setError('Failed to subscribe to real-time updates');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      logger.debug(`Unsubscribing from specialist status updates for ${specialistId}`);
      supabase.removeChannel(channel);
    };
  }, [specialistId, fetchStatus]);

  // Helper function to get status display information
  const getStatusDisplay = useCallback(() => {
    const { status, status_message, last_seen } = statusData;
    
    let displayText = '';
    let colorClass = '';
    
    switch (status) {
      case 'online':
        displayText = status_message || 'Online';
        colorClass = 'bg-green-500';
        break;
      case 'away':
        displayText = status_message || 'Away';
        colorClass = 'bg-yellow-500';
        break;
      case 'busy':
        displayText = status_message || 'Busy';
        colorClass = 'bg-red-500';
        break;
      case 'offline':
      default:
        if (last_seen) {
          const lastSeenDate = new Date(last_seen);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
          
          if (diffMinutes < 1) {
            displayText = 'Last seen just now';
          } else if (diffMinutes < 60) {
            displayText = `Last seen ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            displayText = `Last seen ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
          }
        } else {
          displayText = 'Offline';
        }
        colorClass = 'bg-gray-500';
        break;
    }
    
    return { displayText, colorClass, status };
  }, [statusData]);

  return {
    statusData,
    loading,
    error,
    refetch: fetchStatus,
    getStatusDisplay,
    clearError: () => setError(null)
  };
};