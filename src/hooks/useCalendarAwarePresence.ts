
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateRealTimeAvailability, CalendarAvailabilityResult } from '@/utils/calendarAvailability';
import { logger } from '@/utils/logger';

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
      logger.debug('Fetching specialist ID for user', { userId: user.id });
      supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            logger.error('Error fetching specialist ID', error);
            return;
          }
          if (data && mountedRef.current) {
            logger.debug('Found specialist ID', { specialistId: data.id });
            setCurrentSpecialistId(data.id);
          }
        });
    }
  }, [user, specialistId]);

  // Debounced update function to prevent rapid successive calls
  const updateCalendarAvailability = useCallback(async () => {
    if (!currentSpecialistId || isUpdatingRef.current || !mountedRef.current) {
      logger.debug('Skipping calendar update', { 
        currentSpecialistId, 
        isUpdating: isUpdatingRef.current, 
        mounted: mountedRef.current 
      });
      return;
    }

    // Debounce rapid calls (minimum 1 second between updates)
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) {
      logger.debug('Debouncing calendar update');
      return;
    }

    isUpdatingRef.current = true;
    lastUpdateRef.current = now;

    try {
      logger.debug('Updating calendar availability', { specialistId: currentSpecialistId });
      const availability = await calculateRealTimeAvailability(currentSpecialistId);
      
      if (!mountedRef.current) return;
      
      logger.debug('Calendar availability result', availability);
      setCalendarAvailability(availability);

      // Only update from calendar if no manual override and calendar-controlled
      if (isCalendarControlled && !manualStatusOverride && mountedRef.current) {
        logger.debug('Auto-updating specialist status from calendar', {
          status: availability.status,
          reason: availability.reason
        });
        await updateSpecialistStatusInDB(currentSpecialistId, availability.status, availability.reason || null, {
          calendar_controlled: true,
          availability_check: availability,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error('Error updating calendar availability', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [currentSpecialistId, isCalendarControlled, manualStatusOverride]);

  // Centralized database update function with enhanced error handling
  const updateSpecialistStatusInDB = async (
    specialistId: string, 
    status: 'online' | 'away' | 'offline' | 'busy', 
    message?: string | null,
    presenceData?: any
  ) => {
    try {
      logger.debug('Updating specialist status in DB', { 
        specialistId, 
        status, 
        message,
        presenceData
      });

      // Verify specialist exists and user has permission
      const { data: specialistCheck, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('id, user_id')
        .eq('id', specialistId)
        .single();

      if (specialistError) {
        logger.error('Error checking specialist existence', specialistError);
        throw new Error(`Specialist not found: ${specialistError.message}`);
      }

      if (!specialistCheck) {
        throw new Error('Specialist record not found');
      }

      if (specialistCheck.user_id !== user?.id) {
        throw new Error('Permission denied: You can only update your own status');
      }
      
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
        logger.error('Database update error', error);
        if (error.code === '23505') {
          throw new Error('Status update conflict. Please try again.');
        } else if (error.code === '42501') {
          throw new Error('Permission denied. You may not have access to update this status.');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }
      
      logger.debug('Successfully updated specialist status');
    } catch (error) {
      logger.error('Error updating specialist status in database', error);
      throw error;
    }
  };

  // Enhanced manual status override function
  const setManualStatus = useCallback(async (status: 'online' | 'away' | 'offline' | null, message?: string) => {
    if (!currentSpecialistId || !mountedRef.current) {
      const errorMsg = 'No specialist ID available for manual status change';
      logger.error(errorMsg, { currentSpecialistId, user: user?.id });
      throw new Error(errorMsg);
    }

    if (!user) {
      const errorMsg = 'User not authenticated';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      logger.debug('Setting manual status override', { 
        status, 
        message, 
        specialistId: currentSpecialistId,
        userId: user.id
      });
      
      if (status === null) {
        // Clear manual override and return to calendar control
        if (mountedRef.current) {
          setManualStatusOverride(null);
        }
        
        if (isCalendarControlled && calendarAvailability) {
          logger.debug('Returning to calendar-controlled status', {
            calendarStatus: calendarAvailability.status,
            reason: calendarAvailability.reason
          });
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

      logger.debug('Successfully set manual status');
    } catch (error) {
      logger.error('Error setting manual status', error);
      // Reset local state on error
      if (mountedRef.current) {
        setManualStatusOverride(null);
      }
      throw error;
    }
  }, [currentSpecialistId, isCalendarControlled, calendarAvailability, user]);

  // Toggle calendar control
  const toggleCalendarControl = useCallback(async (enabled: boolean) => {
    if (!mountedRef.current) return;
    
    logger.debug('Toggling calendar control', { enabled, specialistId: currentSpecialistId });
    setIsCalendarControlled(enabled);
    
    if (enabled && currentSpecialistId) {
      // Clear manual override and return to calendar control
      if (mountedRef.current) {
        setManualStatusOverride(null);
      }
      
      logger.debug('Enabling calendar control');
      await updateCalendarAvailability();
    } else if (!enabled && currentSpecialistId) {
      // When disabling calendar control, set to offline by default
      logger.debug('Disabling calendar control, setting offline');
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
      logger.debug('Using manual status override', { status: manualStatusOverride });
      return manualStatusOverride;
    }
    
    // Calendar status if calendar controlled
    if (isCalendarControlled && calendarAvailability) {
      logger.debug('Using calendar status', { status: calendarAvailability.status });
      return calendarAvailability.status;
    }
    
    // Default to offline
    logger.debug('Defaulting to offline status');
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

    logger.debug('Setting up calendar availability monitoring', { specialistId: currentSpecialistId });
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
        logger.debug('Running scheduled availability check');
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
            logger.debug('Appointment changed, updating availability');
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
            logger.debug('Calendar settings changed, updating availability');
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
        logger.debug('Setting specialist offline on page unload');
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
