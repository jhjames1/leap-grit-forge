
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateRealTimeAvailability, updateSpecialistStatusFromCalendar, CalendarAvailabilityResult } from '@/utils/calendarAvailability';

export const useCalendarAwarePresence = (specialistId?: string) => {
  const { user } = useAuth();
  const [calendarAvailability, setCalendarAvailability] = useState<CalendarAvailabilityResult | null>(null);
  const [manualStatus, setManualStatus] = useState<'away' | null>(null);
  const [isCalendarControlled, setIsCalendarControlled] = useState(true);
  const [currentSpecialistId, setCurrentSpecialistId] = useState<string | null>(specialistId || null);

  // Get the specialist ID for the current user if not provided
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
      console.log('Updating calendar availability for specialist:', currentSpecialistId);
      const availability = await calculateRealTimeAvailability(currentSpecialistId);
      console.log('Calendar availability result:', availability);
      setCalendarAvailability(availability);

      // If calendar-controlled and no manual override, update the status automatically
      if (isCalendarControlled && !manualStatus) {
        console.log('Updating specialist status from calendar...');
        await updateSpecialistStatusFromCalendar(currentSpecialistId);
      }
    } catch (error) {
      console.error('Error updating calendar availability:', error);
    }
  }, [currentSpecialistId, isCalendarControlled, manualStatus]);

  // Manual status override (for "away" status)
  const setManualAwayStatus = useCallback(async (isAway: boolean, message?: string) => {
    if (!currentSpecialistId) {
      console.error('No specialist ID available for manual status change');
      return;
    }

    try {
      console.log('Setting manual away status:', isAway, message);
      
      if (isAway) {
        setManualStatus('away');
        const { error } = await supabase
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
        
        if (error) {
          console.error('Error setting away status:', error);
          throw error;
        }
        console.log('Successfully set away status');
      } else {
        setManualStatus(null);
        // Return to calendar-controlled status
        console.log('Clearing manual status, returning to calendar control');
        if (isCalendarControlled) {
          await updateSpecialistStatusFromCalendar(currentSpecialistId);
        }
      }
    } catch (error) {
      console.error('Error setting manual status:', error);
      throw error;
    }
  }, [currentSpecialistId, isCalendarControlled]);

  // Toggle calendar control
  const toggleCalendarControl = useCallback(async (enabled: boolean) => {
    console.log('Toggling calendar control:', enabled);
    setIsCalendarControlled(enabled);
    
    if (enabled && currentSpecialistId) {
      // Return to calendar-controlled status
      setManualStatus(null);
      console.log('Returning to calendar-controlled status');
      await updateSpecialistStatusFromCalendar(currentSpecialistId);
      // Refresh availability after enabling calendar control
      await updateCalendarAvailability();
    } else if (!enabled && currentSpecialistId) {
      // When disabling calendar control, set to offline by default
      console.log('Disabling calendar control, setting offline');
      const { error } = await supabase
        .from('specialist_status')
        .upsert({
          specialist_id: currentSpecialistId,
          status: 'offline',
          status_message: 'Manual control mode',
          last_seen: new Date().toISOString(),
          presence_data: {
            calendar_controlled: false,
            manual_override: true,
            timestamp: Date.now()
          }
        });
      
      if (error) {
        console.error('Error setting manual offline status:', error);
      }
    }
  }, [currentSpecialistId, updateCalendarAvailability]);

  // Set up real-time monitoring
  useEffect(() => {
    if (!currentSpecialistId) return;

    console.log('Setting up calendar availability monitoring for specialist:', currentSpecialistId);

    // Initial availability check
    updateCalendarAvailability();

    // Set up interval to check availability every minute
    const interval = setInterval(() => {
      console.log('Running scheduled availability check...');
      updateCalendarAvailability();
    }, 60000);

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
        console.log('Setting specialist offline on page unload');
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
