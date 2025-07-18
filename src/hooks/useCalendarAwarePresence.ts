
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateRealTimeAvailability, updateSpecialistStatusFromCalendar, CalendarAvailabilityResult } from '@/utils/calendarAvailability';

export const useCalendarAwarePresence = (specialistId?: string) => {
  const { user } = useAuth();
  const [calendarAvailability, setCalendarAvailability] = useState<CalendarAvailabilityResult | null>(null);
  const [manualStatus, setManualStatus] = useState<'away' | null>(null);
  const [isCalendarControlled, setIsCalendarControlled] = useState(true);

  // Get the specialist ID for the current user if not provided
  const [currentSpecialistId, setCurrentSpecialistId] = useState<string | null>(specialistId || null);

  useEffect(() => {
    if (!specialistId && user) {
      supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentSpecialistId(data.id);
          }
        });
    }
  }, [user, specialistId]);

  // Calculate calendar availability
  const updateCalendarAvailability = useCallback(async () => {
    if (!currentSpecialistId) return;

    try {
      const availability = await calculateRealTimeAvailability(currentSpecialistId);
      setCalendarAvailability(availability);

      // If calendar-controlled, update the status automatically
      if (isCalendarControlled && !manualStatus) {
        await updateSpecialistStatusFromCalendar(currentSpecialistId);
      }
    } catch (error) {
      console.error('Error updating calendar availability:', error);
    }
  }, [currentSpecialistId, isCalendarControlled, manualStatus]);

  // Manual status override (for "away" status)
  const setManualAwayStatus = useCallback(async (isAway: boolean, message?: string) => {
    if (!currentSpecialistId) return;

    try {
      if (isAway) {
        setManualStatus('away');
        await supabase
          .from('specialist_status')
          .upsert({
            specialist_id: currentSpecialistId,
            status: 'away',
            status_message: message || 'Temporarily away',
            last_seen: new Date().toISOString(),
            presence_data: {
              calendar_controlled: false,
              manual_override: true,
              timestamp: Date.now()
            }
          });
      } else {
        setManualStatus(null);
        // Return to calendar-controlled status
        await updateSpecialistStatusFromCalendar(currentSpecialistId);
      }
    } catch (error) {
      console.error('Error setting manual status:', error);
    }
  }, [currentSpecialistId]);

  // Toggle calendar control
  const toggleCalendarControl = useCallback(async (enabled: boolean) => {
    setIsCalendarControlled(enabled);
    
    if (enabled && currentSpecialistId) {
      // Return to calendar-controlled status
      setManualStatus(null);
      await updateSpecialistStatusFromCalendar(currentSpecialistId);
    }
  }, [currentSpecialistId]);

  // Set up real-time monitoring
  useEffect(() => {
    if (!currentSpecialistId) return;

    // Initial availability check
    updateCalendarAvailability();

    // Set up interval to check availability every minute
    const interval = setInterval(updateCalendarAvailability, 60000);

    // Set up real-time subscriptions for schedule changes
    const channel = supabase
      .channel('calendar-availability-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_appointments',
          filter: `specialist_id=eq.${currentSpecialistId}`
        },
        () => {
          console.log('Appointment changed, updating availability');
          updateCalendarAvailability();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_calendar_settings',
          filter: `specialist_id=eq.${currentSpecialistId}`
        },
        () => {
          console.log('Calendar settings changed, updating availability');
          updateCalendarAvailability();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_availability_exceptions',
          filter: `specialist_id=eq.${currentSpecialistId}`
        },
        () => {
          console.log('Availability exceptions changed, updating availability');
          updateCalendarAvailability();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [currentSpecialistId, updateCalendarAvailability]);

  // Set offline status when component unmounts or user logs out
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentSpecialistId) {
        await supabase
          .from('specialist_status')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString()
          })
          .eq('specialist_id', currentSpecialistId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [currentSpecialistId]);

  return {
    calendarAvailability,
    manualStatus,
    isCalendarControlled,
    setManualAwayStatus,
    toggleCalendarControl,
    refreshAvailability: updateCalendarAvailability,
    specialistId: currentSpecialistId
  };
};
