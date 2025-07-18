import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

interface CalendarSettings {
  id: string;
  specialist_id: string;
  timezone: string;
  default_appointment_duration: number;
  buffer_time_minutes: number;
  minimum_notice_hours: number;
  maximum_booking_days: number;
  auto_confirm_bookings: boolean;
  allow_back_to_back_bookings: boolean;
  working_hours: Json;
  notification_preferences: Json;
  external_calendar_sync: Json;
  created_at: string;
  updated_at: string;
}

// Type guards for safe JSON parsing
const isWorkingHours = (value: Json): value is Record<string, { start: string; end: string }> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isNotificationPrefs = (value: Json): value is { email: boolean; sms: boolean; app: boolean } => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isExternalCalendarSync = (value: Json): value is { enabled: boolean; provider: string | null; calendar_id: string | null } => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

interface AvailabilitySlot {
  id: string;
  start: Date;
  end: Date;
  appointmentTypeId: string;
  isAvailable: boolean;
  isBooked: boolean;
  appointment?: {
    id: string;
    user_id: string;
    status: string;
    meeting_type: string;
  };
}

interface UseSpecialistCalendarProps {
  specialistId: string;
}

export function useSpecialistCalendar({ specialistId }: UseSpecialistCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar settings
  const fetchCalendarSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_calendar_settings')
        .select('*')
        .eq('specialist_id', specialistId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          await createDefaultSettings();
          return;
        }
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
      setError('Failed to load calendar settings');
    }
  }, [specialistId]);

  // Create default settings
  const createDefaultSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_calendar_settings')
        .insert({
          specialist_id: specialistId,
          timezone: 'UTC',
          default_appointment_duration: 30,
          buffer_time_minutes: 15,
          minimum_notice_hours: 2,
          maximum_booking_days: 30,
          auto_confirm_bookings: true,
          allow_back_to_back_bookings: false,
          working_hours: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
          } as Json,
          notification_preferences: {
            email: true,
            sms: false,
            app: true,
          } as Json,
          external_calendar_sync: {
            enabled: false,
            provider: null,
            calendar_id: null,
          } as Json,
        })
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error creating default settings:', error);
      setError('Failed to create calendar settings');
    }
  };

  // Update calendar settings
  const updateCalendarSettings = useCallback(async (updates: Partial<CalendarSettings>) => {
    try {
      const { data, error } = await supabase
        .from('specialist_calendar_settings')
        .update(updates)
        .eq('specialist_id', specialistId)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
      toast({
        title: "Success",
        description: "Calendar settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating calendar settings:', error);
      toast({
        title: "Error",
        description: "Failed to update calendar settings",
        variant: "destructive"
      });
    }
  }, [specialistId, toast]);

  // Check availability for a specific time slot
  const checkAvailability = useCallback(async (start: Date, end: Date) => {
    try {
      const { data, error } = await supabase
        .rpc('check_specialist_availability', {
          p_specialist_id: specialistId,
          p_start_time: start.toISOString(),
          p_end_time: end.toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }, [specialistId]);

  // Get availability slots for a date range
  const getAvailabilitySlots = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      
      // Fetch schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('specialist_schedules')
        .select(`
          *,
          appointment_types (
            id,
            name,
            default_duration,
            color
          )
        `)
        .eq('specialist_id', specialistId)
        .eq('is_active', true);

      if (schedulesError) throw schedulesError;

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('specialist_appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('scheduled_start', startDate.toISOString())
        .lte('scheduled_end', endDate.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress']);

      if (appointmentsError) throw appointmentsError;

      // Fetch exceptions
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (exceptionsError) throw exceptionsError;

      // Generate availability slots
      const slots: AvailabilitySlot[] = [];
      
      // TODO: Implement slot generation logic based on schedules, appointments, and exceptions
      // This would involve complex date/time calculations to generate available time slots
      
      setAvailabilitySlots(slots);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      setError('Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  }, [specialistId]);

  // Create availability block
  const createAvailabilityBlock = useCallback(async (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    appointmentTypeId: string,
    bufferTime: number = 15
  ) => {
    try {
      const { data, error } = await supabase
        .from('specialist_schedules')
        .insert({
          specialist_id: specialistId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          appointment_type_id: appointmentTypeId,
          buffer_time_minutes: bufferTime,
          is_recurring: true,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Availability block created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating availability block:', error);
      toast({
        title: "Error",
        description: "Failed to create availability block",
        variant: "destructive"
      });
      throw error;
    }
  }, [specialistId, toast]);

  // Create availability exception
  const createAvailabilityException = useCallback(async (
    startTime: Date,
    endTime: Date,
    exceptionType: 'unavailable' | 'available' | 'busy',
    reason?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('specialist_availability_exceptions')
        .insert({
          specialist_id: specialistId,
          exception_type: exceptionType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reason: reason || null,
          is_recurring: false
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Availability exception created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating availability exception:', error);
      toast({
        title: "Error",
        description: "Failed to create availability exception",
        variant: "destructive"
      });
      throw error;
    }
  }, [specialistId, toast]);

  // Initialize data
  useEffect(() => {
    if (specialistId) {
      fetchCalendarSettings();
    }
  }, [specialistId, fetchCalendarSettings]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!specialistId) return;

    console.log('🔄 Setting up real-time subscriptions for specialist:', specialistId);

    // Create a channel for real-time updates
    const channel = supabase
      .channel('specialist-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_calendar_settings',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('🔄 Calendar settings changed:', payload);
          fetchCalendarSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_schedules',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('🔄 Schedule changed:', payload);
          // Trigger calendar refresh in components listening to this hook
          setSettings(prev => ({ ...prev, updated_at: new Date().toISOString() } as CalendarSettings));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_appointments',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('🔄 Appointment changed:', payload);
          // Trigger calendar refresh in components listening to this hook
          setSettings(prev => ({ ...prev, updated_at: new Date().toISOString() } as CalendarSettings));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_availability_exceptions',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('🔄 Availability exception changed:', payload);
          // Trigger calendar refresh in components listening to this hook
          setSettings(prev => ({ ...prev, updated_at: new Date().toISOString() } as CalendarSettings));
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [specialistId, fetchCalendarSettings]);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Helper functions to safely extract typed values
  const getWorkingHours = useCallback(() => {
    if (!settings?.working_hours) return {};
    if (isWorkingHours(settings.working_hours)) {
      return settings.working_hours;
    }
    return {};
  }, [settings?.working_hours]);

  const getNotificationPreferences = useCallback(() => {
    if (!settings?.notification_preferences) return { email: true, sms: false, app: true };
    if (isNotificationPrefs(settings.notification_preferences)) {
      return settings.notification_preferences;
    }
    return { email: true, sms: false, app: true };
  }, [settings?.notification_preferences]);

  const getExternalCalendarSync = useCallback(() => {
    if (!settings?.external_calendar_sync) return { enabled: false, provider: null, calendar_id: null };
    if (isExternalCalendarSync(settings.external_calendar_sync)) {
      return settings.external_calendar_sync;
    }
    return { enabled: false, provider: null, calendar_id: null };
  }, [settings?.external_calendar_sync]);

  return {
    settings,
    availabilitySlots,
    loading,
    error,
    fetchCalendarSettings,
    updateCalendarSettings,
    checkAvailability,
    getAvailabilitySlots,
    createAvailabilityBlock,
    createAvailabilityException,
    // Helper functions for typed access
    getWorkingHours,
    getNotificationPreferences,
    getExternalCalendarSync,
  };
}