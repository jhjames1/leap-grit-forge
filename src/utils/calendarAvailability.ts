
import { supabase } from '@/integrations/supabase/client';

export interface CalendarAvailabilityResult {
  isAvailable: boolean;
  status: 'online' | 'busy' | 'offline';
  reason?: string;
  nextAvailable?: Date;
}

interface WorkingHours {
  [key: string]: {
    start: string;
    end: string;
    enabled?: boolean;
  };
}

export const calculateRealTimeAvailability = async (
  specialistId: string
): Promise<CalendarAvailabilityResult> => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  try {
    // Get calendar settings
    const { data: settings } = await supabase
      .from('specialist_calendar_settings')
      .select('working_hours')
      .eq('specialist_id', specialistId)
      .single();

    if (!settings?.working_hours) {
      return { isAvailable: false, status: 'offline', reason: 'No working hours configured' };
    }

    const workingHours = settings.working_hours as WorkingHours;
    const todayHours = workingHours[dayOfWeek];

    // Check if today has working hours and if they're enabled
    if (!todayHours || todayHours.enabled === false) {
      return { isAvailable: false, status: 'offline', reason: 'Not scheduled to work today' };
    }

    // Check if within working hours
    const isWithinWorkingHours = currentTime >= todayHours.start && currentTime <= todayHours.end;
    
    if (!isWithinWorkingHours) {
      return { 
        isAvailable: false, 
        status: 'offline', 
        reason: 'Outside working hours',
        nextAvailable: getNextAvailableTime(workingHours, now)
      };
    }

    // Check for active appointments
    const { data: activeAppointments } = await supabase
      .from('specialist_appointments')
      .select('*')
      .eq('specialist_id', specialistId)
      .in('status', ['confirmed', 'in_progress'])
      .lte('scheduled_start', now.toISOString())
      .gte('scheduled_end', now.toISOString());

    if (activeAppointments && activeAppointments.length > 0) {
      return { 
        isAvailable: false, 
        status: 'busy', 
        reason: 'In appointment',
        nextAvailable: new Date(activeAppointments[0].scheduled_end)
      };
    }

    // Check for blocked time (one-time exceptions)
    const { data: blockedTime } = await supabase
      .from('specialist_availability_exceptions')
      .select('*')
      .eq('specialist_id', specialistId)
      .eq('is_recurring', false)
      .eq('exception_type', 'unavailable')
      .lte('start_time', now.toISOString())
      .gte('end_time', now.toISOString());

    if (blockedTime && blockedTime.length > 0) {
      return { 
        isAvailable: false, 
        status: 'busy', 
        reason: blockedTime[0].reason || 'Blocked time',
        nextAvailable: new Date(blockedTime[0].end_time)
      };
    }

    // Check for active recurring patterns
    const { data: recurringPatterns } = await supabase
      .from('specialist_availability_exceptions')
      .select('*')
      .eq('specialist_id', specialistId)
      .eq('is_recurring', true)
      .eq('exception_type', 'unavailable');

    if (recurringPatterns) {
      for (const pattern of recurringPatterns) {
        if (isCurrentlyInRecurringPattern(pattern, now)) {
          return { 
            isAvailable: false, 
            status: 'busy', 
            reason: pattern.reason || 'Recurring blocked time'
          };
        }
      }
    }

    // If all checks pass, specialist is available
    return { isAvailable: true, status: 'online' };

  } catch (error) {
    console.error('Error calculating availability:', error);
    return { isAvailable: false, status: 'offline', reason: 'Error checking availability' };
  }
};

const isCurrentlyInRecurringPattern = (pattern: any, now: Date): boolean => {
  if (!pattern.recurrence_pattern?.days_of_week) return false;

  const currentDayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  // Check if current day is in the pattern
  if (!pattern.recurrence_pattern.days_of_week.includes(currentDayOfWeek)) {
    return false;
  }

  // Check if current time is within the pattern's time range
  const patternStart = new Date(pattern.start_time).toTimeString().slice(0, 5);
  const patternEnd = new Date(pattern.end_time).toTimeString().slice(0, 5);
  
  return currentTime >= patternStart && currentTime <= patternEnd;
};

const getNextAvailableTime = (workingHours: WorkingHours, currentTime: Date): Date | undefined => {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = currentTime.getDay();
  
  // Check remaining days in the week
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentDay + i) % 7;
    const dayName = daysOfWeek[dayIndex];
    const dayHours = workingHours[dayName];
    
    if (dayHours && dayHours.enabled !== false) {
      const nextDate = new Date(currentTime);
      nextDate.setDate(nextDate.getDate() + i);
      const [hours, minutes] = dayHours.start.split(':').map(Number);
      nextDate.setHours(hours, minutes, 0, 0);
      return nextDate;
    }
  }
  
  return undefined;
};

export const updateSpecialistStatusFromCalendar = async (specialistId: string): Promise<void> => {
  const availability = await calculateRealTimeAvailability(specialistId);
  
  try {
    // Update specialist status with proper conflict resolution
    await supabase
      .from('specialist_status')
      .upsert({
        specialist_id: specialistId,
        status: availability.status,
        status_message: availability.reason || null,
        last_seen: new Date().toISOString(),
        presence_data: {
          calendar_controlled: true,
          availability_check: {
            isAvailable: availability.isAvailable,
            status: availability.status,
            reason: availability.reason || null,
            nextAvailable: availability.nextAvailable?.toISOString() || null
          },
          timestamp: Date.now()
        }
      }, {
        onConflict: 'specialist_id'
      });
  } catch (error) {
    console.error('Error updating specialist status from calendar:', error);
  }
};
