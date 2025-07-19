
import { useState, useEffect,callback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateRealTimeAvailability, CalendarAvailabilityResult } from '@/utils/calendarAvailability';

export const useCalendarAwarePresence = (specialistId?: string) => {
  const { user } = useAuth();
  const [calendarAvailability, setCalendarAvailability] = useState<CalendarAvailabilityResult | null>(null);
  const [manualStatusOverride, setManualStatusOverride] = useState<'online' | 'away' | 'offline' | null>(null);
  const [isCalendarControlled, setIsCalendarControlled] = useState(true);
  const [currentSpecialistId, setCurrentSpecialistId] = useState<string | null>(specialistId || null);

  // Use refs to prevent race conditions and multiple simultaneous operations
  const isUpdatingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(0);

  // Get the specialist ID for the current user if not provided
  useEffect(() => {
    if (!specialistId && user && mountedRef.current) {
      supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data && mountedRef.current) {
            setCurrentSpecialistId(data.id);
          }
        });
    }
  }, [user, specialistId]);

  // Debounced update function to prevent rapid successive calls
  const updateCalendarAvailability = useCallback(async () => {
    if (!currentSpecialistId || isUpdatingRef.current || !mountedRef.current) {
      return;
    }

    // Debounce rapid calls (minimum 1 second between updates)
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) {
      return;
    }

    isUpdatingRef.current = true;
    lastUpdateRef.current = now;

    try {
      console.log('🔄 Updating calendar availability for specialist:', currentSpecialistId);
      const availability = await calculateRealTimeAvailability(currentSpecialistId);
      
      if (!mountedRef.current) return;
      
      console.log('📅 Calendar availability result:', availability);
      setCalendarAvailability(availability);

      // Only update from calendar if no manual override and calendar-controlled
      if (isCalendarControlled && !manualStatusOverride && mountedRef.current) {
        console.log('🤖 Auto-updating specialist status from calendar...');
        await updateSpecialistStatusInDB(currentSpecialistId, availability.status, availability.reason || null, {
          calendar_controlled: true,
          availability_check: availability,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ Error updating calendar availability:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [currentSpecialistId, isCalendarControlled, manualStatusOverride]);

  // Centralized database update function
  const updateSpecialistStatusInDB = async (
    specialistId: string, 
    status: 'online' | 'away' | 'offline' | 'busy', 
    message?: string | null,
    presenceData?: any
  ) => {
    try {
      console.log('💾 Updating specialist status in DB:', { specialistId, status, message });
      
      const { error } = await supabase
        .from('specialist_status')
        .upsert({
          specialist_id: specialistId,
          status,
          status_message: message || null,
          last_seen: new Date().toISOString(),
          presence_data: presenceData || {
            manual_override: true,
            timestamp: Date.now()
          }
        }, {
          onConflict: 'specialist_id'
        });
      
      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }
      
      console.log('✅ Successfully updated specialist status');
    } catch (error) {
      console.error('❌ Error updating specialist status in database:', error);
      throw error;
    }
  };

  // Manual status override function
  const setManualStatus = useCallback(async (status: 'online' | 'away' | 'offline' | null, message?: string) => {
    if (!currentSpecialistId || !mountedRef.current) {
      console.error('❌ No specialist ID available for manual status change');
      throw new Error('No specialist ID available');
    }

    try {
      console.log('👤 Setting manual status override:', { status, message });
      
      if (status === null) {
        // Clear manual override and return to calendar control
        if (mountedRef.current) {
          setManualStatusOverride(null);
        }
        
        if (isCalendarControlled && calendarAvailability) {
          console.log('🔄 Returning to calendar-controlled status');
          await updateSpecialistStatusInDB(
            currentSpecialistId, 
            calendarAvailability.status, 
            calendarAvailability.reason,
            {
              calendar_controlled: true,
              availability_check: calendarAvailability,
              timestamp: Date.now()
            }
          );
        }
      } else {
        // Set manual override
        if (mountedRef.current) {
          setManualStatusOverride(status);
        }
        
        await updateSpecialistStatusInDB(
          currentSpecialistId, 
          status, 
          message || `Manually set to ${status}`,
          {
            calendar_controlled: false,
            manual_override: true,
            manual_status: status,
            timestamp: Date.now()
          }
        );
      }

      console.log('✅ Successfully set manual status');
    } catch (error) {
      console.error('❌ Error setting manual status:', error);
      throw error;
    }
  }, [currentSpecialistId, isCalendarControlled, calendarAvailability]);

  // Toggle calendar control
  const toggleCalendarControl = useCallback(async (enabled: boolean) => {
    if (!mountedRef.current) return;
    
    console.log('🔄 Toggling calendar control:', enabled);
    setIsCalendarControlled(enabled);
    
    if (enabled && currentSpecialistId) {
      // Clear manual override and return to calendar control
      if (mountedRef.current) {
        setManualStatusOverride(null);
      }
      
      console.log('🤖 Enabling calendar control');
      await updateCalendarAvailability();
    } else if (!enabled && currentSpecialistId) {
      // When disabling calendar control, set to offline by default
      console.log('👤 Disabling calendar control, setting offline');
      await updateSpecialistStatusInDB(
        currentSpecialistId,
        'offline',
        'Manual control mode',
        {
          calendar_controlled: false,
          manual_override: true,
          timestamp: Date.now()
        }
      );
    }
  }, [currentSpecialistId, updateCalendarAvailability]);

  // Get effective status with clear precedence
  const getEffectiveStatus = (): 'online' | 'away' | 'offline' | 'busy' => {
    // Manual override takes highest precedence
    if (manualStatusOverride) {
      console.log('📍 Using manual status override:', manualStatusOverride);
      return manualStatusOverride;
    }
    
    // Calendar status if calendar controlled
    if (isCalendarControlled && calendarAvailability) {
      console.log('📅 Using calendar status:', calendarAvailability.status);
      return calendarAvailability.status;
    }
    
    // Default to offline
    console.log('🔌 Defaulting to offline status');
    return 'offline';
  };

  const getStatusMessage = () => {
    if (manualStatusOverride) return `Manually set to ${manualStatusOverride}`;
    if (!isCalendarControlled) return 'Manual control mode';
    if (calendarAvailability?.reason) return calendarAvailability.reason;
    return null;
  };

  // Set up real-time monitoring with proper cleanup
  useEffect(() => {
    if (!currentSpecialistId) return;

    console.log('🔗 Setting up calendar availability monitoring for specialist:', currentSpecialistId);
    mountedRef.current = true;

    // Initial availability check with delay to prevent rapid calls
    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        updateCalendarAvailability();
      }
    }, 100);

    // Set up interval to check availability every minute
    const interval = setInterval(() => {
      if (mountedRef.current) {
        console.log('⏰ Running scheduled availability check...');
        updateCalendarAvailability();
      }
    }, 60000);

    // Set up real-time subscriptions for schedule changes
    const channel = supabase
      .channel(`calendar-availability-changes-${currentSpecialistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_appointments',
          filter: `specialist_id=eq.${currentSpecialistId}`
        },
        () => {
          if (mountedRef.current && !isUpdatingRef.current) {
            console.log('📅 Appointment changed, updating availability');
            setTimeout(() => {
              if (mountedRef.current) {
                updateCalendarAvailability();
              }
            }, 500);
          }
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
          if (mountedRef.current && !isUpdatingRef.current) {
            console.log('⚙️ Calendar settings changed, updating availability');
            setTimeout(() => {
              if (mountedRef.current) {
                updateCalendarAvailability();
              }
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
      supabase.removeChannel(channel);
      isUpdatingRef.current = false;
    };
  }, [currentSpecialistId, updateCalendarAvailability]);

  // Set offline status when component unmounts or user logs out
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentSpecialistId) {
        console.log('🔌 Setting specialist offline on page unload');
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
      mountedRef.current = false;
      if (currentSpecialistId) {
        handleBeforeUnload();
      }
    };
  }, [currentSpecialistId]);

  return {
    calendarAvailability,
    manualStatusOverride,
    isCalendarControlled,
    setManualStatus,
    toggleCalendarControl,
    refreshAvailability: updateCalendarAvailability,
    specialistId: currentSpecialistId,
    getEffectiveStatus,
    getStatusMessage
  };
};
