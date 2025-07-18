
import { supabase } from '@/integrations/supabase/client';
import { addMinutes, format, startOfDay, endOfDay } from 'date-fns';

export interface CalendarAvailabilityResult {
  isAvailable: boolean;
  status: 'online' | 'busy' | 'offline';
  reason?: string;
  nextAvailable?: Date;
  currentAppointment?: {
    id: string;
    title: string;
    end_time: Date;
  };
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
      .select('*')
      .eq('specialist_id', specialistId)
      .single();

    if (!settings?.working_hours) {
      return { 
        isAvailable: false, 
        status: 'offline', 
        reason: 'No working hours configured' 
      };
    }

    const workingHours = settings.working_hours as WorkingHours;
    const todayHours = workingHours[dayOfWeek];

    // Check if today has working hours and if they're enabled
    if (!todayHours || todayHours.enabled === false) {
      const nextAvailable = await getNextWorkingDay(workingHours, now);
      return { 
        isAvailable: false, 
        status: 'offline', 
        reason: 'Not scheduled to work today',
        nextAvailable
      };
    }

    // Check if within working hours
    const isWithinWorkingHours = currentTime >= todayHours.start && currentTime <= todayHours.end;
    
    if (!isWithinWorkingHours) {
      const nextAvailable = currentTime < todayHours.start 
        ? getTodayStartTime(now, todayHours.start)
        : await getNextWorkingDay(workingHours, now);
        
      return { 
        isAvailable: false, 
        status: 'offline', 
        reason: `Outside working hours (${todayHours.start} - ${todayHours.end})`,
        nextAvailable
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
      const appointment = activeAppointments[0];
      const endTime = new Date(appointment.scheduled_end);
      const bufferedEndTime = addMinutes(endTime, settings.buffer_time_minutes || 15);
      
      return { 
        isAvailable: false, 
        status: 'busy', 
        reason: `In appointment until ${format(endTime, 'h:mm a')}`,
        nextAvailable: bufferedEndTime,
        currentAppointment: {
          id: appointment.id,
          title: `Appointment (${appointment.meeting_type})`,
          end_time: endTime
        }
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
      const block = blockedTime[0];
      const endTime = new Date(block.end_time);
      
      return { 
        isAvailable: false, 
        status: 'busy', 
        reason: block.reason || 'Blocked time',
        nextAvailable: endTime
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
          const patternEndTime = getRecurringPatternEndTime(pattern, now);
          
          return { 
            isAvailable: false, 
            status: 'busy', 
            reason: pattern.reason || 'Recurring blocked time',
            nextAvailable: patternEndTime
          };
        }
      }
    }

    // Check upcoming appointments within buffer time
    const bufferEndTime = addMinutes(now, settings.buffer_time_minutes || 15);
    const { data: upcomingAppointments } = await supabase
      .from('specialist_appointments')
      .select('*')
      .eq('specialist_id', specialistId)
      .in('status', ['confirmed', 'scheduled'])
      .gte('scheduled_start', now.toISOString())
      .lte('scheduled_start', bufferEndTime.toISOString())
      .order('scheduled_start', { ascending: true });

    if (upcomingAppointments && upcomingAppointments.length > 0) {
      const nextAppointment = upcomingAppointments[0];
      const startTime = new Date(nextAppointment.scheduled_start);
      
      return {
        isAvailable: false,
        status: 'busy',
        reason: `Next appointment in ${Math.ceil((startTime.getTime() - now.getTime()) / 60000)} minutes`,
        nextAvailable: addMinutes(new Date(nextAppointment.scheduled_end), settings.buffer_time_minutes || 15)
      };
    }

    // If all checks pass, specialist is available
    return { isAvailable: true, status: 'online' };

  } catch (error) {
    console.error('Error calculating availability:', error);
    return { 
      isAvailable: false, 
      status: 'offline', 
      reason: 'Error checking availability' 
    };
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

const getRecurringPatternEndTime = (pattern: any, now: Date): Date => {
  const patternEndTime = new Date(pattern.end_time);
  const endTime = new Date(now);
  endTime.setHours(patternEndTime.getHours(), patternEndTime.getMinutes(), 0, 0);
  return endTime;
};

const getTodayStartTime = (now: Date, startTime: string): Date => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const todayStart = new Date(now);
  todayStart.setHours(hours, minutes, 0, 0);
  return todayStart;
};

const getNextWorkingDay = async (workingHours: WorkingHours, currentTime: Date): Promise<Date | undefined> => {
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
    // Update specialist status
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
            nextAvailable: availability.nextAvailable?.toISOString() || null,
            currentAppointment: availability.currentAppointment || null
          },
          timestamp: Date.now()
        }
      });
  } catch (error) {
    console.error('Error updating specialist status from calendar:', error);
  }
};
