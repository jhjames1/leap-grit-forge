
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, isSameDay, startOfDay, endOfDay, addDays, addWeeks } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Users, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SetAvailabilityDialog } from './SetAvailabilityDialog';
import { BlockTimeDialog } from './BlockTimeDialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'availability' | 'appointment' | 'exception' | 'recurring_pattern';
    status?: string;
    appointmentType?: string;
    userId?: string;
    color?: string;
    isRecurring?: boolean;
    patternId?: string;
  };
}

interface AppointmentType {
  id: string;
  name: string;
  description: string;
  default_duration: number;
  color: string;
  is_active: boolean;
}

interface SpecialistCalendarProps {
  specialistId: string;
}

export default function SpecialistCalendar({ specialistId }: SpecialistCalendarProps) {
  console.log('🗓️ SpecialistCalendar - Component mounted with specialistId:', specialistId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedView, setSelectedView] = useState<View>(Views.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [specialistName, setSpecialistName] = useState<string>('');

  // Helper function to expand recurring patterns into individual events
  const expandRecurringPattern = useCallback((pattern: any, startDate: Date, endDate: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const { recurrence_pattern, start_time, end_time, reason, exception_type, id } = pattern;
    
    if (!recurrence_pattern?.days_of_week) return events;

    const patternStartTime = new Date(`2000-01-01T${new Date(start_time).toTimeString().slice(0, 8)}`);
    const patternEndTime = new Date(`2000-01-01T${new Date(end_time).toTimeString().slice(0, 8)}`);
    
    // Generate events for each occurrence within the date range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (recurrence_pattern.days_of_week.includes(dayOfWeek)) {
        const eventStart = new Date(currentDate);
        eventStart.setHours(patternStartTime.getHours(), patternStartTime.getMinutes(), 0, 0);
        
        const eventEnd = new Date(currentDate);
        eventEnd.setHours(patternEndTime.getHours(), patternEndTime.getMinutes(), 0, 0);

        // Determine event title and color based on exception type
        const isAvailable = exception_type === 'available';
        const title = isAvailable 
          ? `Recurring Available - ${reason || 'Available time'}`
          : `Recurring Block - ${reason || 'Blocked time'}`;
        
        events.push({
          id: `recurring-${id}-${currentDate.toISOString().split('T')[0]}`,
          title,
          start: eventStart,
          end: eventEnd,
          resource: {
            type: 'recurring_pattern',
            color: isAvailable ? '#22c55e' : '#f97316', // Green for available, orange for blocked
            isRecurring: true,
            patternId: id
          }
        });
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    return events;
  }, []);

  // Fetch specialist information
  const fetchSpecialistInfo = useCallback(async () => {
    console.log('🗓️ SpecialistCalendar - fetchSpecialistInfo called');
    try {
      const { data, error } = await supabase
        .from('peer_specialists')
        .select('first_name, last_name')
        .eq('id', specialistId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const fullName = `${data.first_name} ${data.last_name}`.trim();
        setSpecialistName(fullName);
        console.log('🗓️ SpecialistCalendar - Specialist name set:', fullName);
      }
    } catch (error) {
      console.error('Error fetching specialist info:', error);
      setSpecialistName('Specialist'); // Fallback name
    }
  }, [specialistId]);

  // Fetch appointment types
  const fetchAppointmentTypes = useCallback(async () => {
    console.log('🗓️ SpecialistCalendar - fetchAppointmentTypes called');
    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.log('🗓️ SpecialistCalendar - Appointment types fetched:', data);
      setAppointmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment types",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Fetch calendar events (schedules, appointments, exceptions, and recurring patterns)
  const fetchEvents = useCallback(async () => {
    console.log('🗓️ SpecialistCalendar - fetchEvents called with user:', user, 'specialistId:', specialistId);
    if (!user || !specialistId) return;

    try {
      setLoading(true);
      const events: CalendarEvent[] = [];
      const today = new Date();
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Fetch regular schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('specialist_schedules')
        .select(`
          *,
          appointment_types (
            name,
            color,
            default_duration
          )
        `)
        .eq('specialist_id', specialistId)
        .eq('is_active', true);

      if (schedulesError) throw schedulesError;
      console.log('🗓️ SpecialistCalendar - Schedules fetched:', schedules);

      // Convert schedules to recurring events
      if (schedules) {
        schedules.forEach(schedule => {
          const startTime = new Date(`2000-01-01T${schedule.start_time}`);
          const endTime = new Date(`2000-01-01T${schedule.end_time}`);
          
          // Generate recurring events for the next 30 days
          for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === schedule.day_of_week) {
              const eventStart = new Date(d);
              eventStart.setHours(startTime.getHours(), startTime.getMinutes());
              
              const eventEnd = new Date(d);
              eventEnd.setHours(endTime.getHours(), endTime.getMinutes());

              events.push({
                id: `schedule-${schedule.id}-${d.toISOString().split('T')[0]}`,
                title: `Available - ${schedule.appointment_types?.name || 'General'}`,
                start: eventStart,
                end: eventEnd,
                resource: {
                  type: 'availability',
                  color: schedule.appointment_types?.color || '#10b981'
                }
              });
            }
          }
        });
      }

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('specialist_appointments')
        .select(`
          *,
          appointment_types (
            name,
            color
          )
        `)
        .eq('specialist_id', specialistId)
        .gte('scheduled_start', new Date().toISOString())
        .lte('scheduled_start', endDate.toISOString());

      if (appointmentsError) throw appointmentsError;
      console.log('🗓️ SpecialistCalendar - Appointments fetched:', appointments);

      // Convert appointments to events
      if (appointments) {
        appointments.forEach(appointment => {
          events.push({
            id: `appointment-${appointment.id}`,
            title: `${appointment.appointment_types?.name || 'Appointment'} - ${appointment.status}`,
            start: new Date(appointment.scheduled_start),
            end: new Date(appointment.scheduled_end),
            resource: {
              type: 'appointment',
              status: appointment.status,
              appointmentType: appointment.appointment_types?.name,
              color: appointment.appointment_types?.color || '#3b82f6'
            }
          });
        });
      }

      // Fetch one-time exceptions (blocked time)
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_recurring', false)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', endDate.toISOString());

      if (exceptionsError) throw exceptionsError;
      console.log('🗓️ SpecialistCalendar - One-time exceptions fetched:', exceptions);

      // Convert one-time exceptions to events
      if (exceptions) {
        exceptions.forEach(exception => {
          const hasUser = exception.reason && 
            (exception.reason.toLowerCase().includes('user') || 
             exception.reason.toLowerCase().includes('client') || 
             exception.reason.toLowerCase().includes('patient') ||
             exception.reason.toLowerCase().includes('meeting'));
          
          events.push({
            id: `exception-${exception.id}`,
            title: `${exception.exception_type === 'unavailable' ? 'Unavailable' : 'Blocked'} - ${exception.reason || 'No reason'}`,
            start: new Date(exception.start_time),
            end: new Date(exception.end_time),
            resource: {
              type: 'exception',
              userId: hasUser ? 'user' : undefined,
              color: hasUser ? '#f59e0b' : '#ef4444'
            }
          });
        });
      }

      // Fetch recurring patterns
      const { data: recurringPatterns, error: recurringError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_recurring', true);

      if (recurringError) throw recurringError;
      console.log('🗓️ SpecialistCalendar - Recurring patterns fetched:', recurringPatterns);

      // Expand recurring patterns into individual events
      if (recurringPatterns) {
        recurringPatterns.forEach(pattern => {
          const recurringEvents = expandRecurringPattern(pattern, today, endDate);
          events.push(...recurringEvents);
        });
      }

      console.log('🗓️ SpecialistCalendar - All events processed:', events);
      setEvents(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, specialistId, toast, expandRecurringPattern]);

  // Initialize data
  useEffect(() => {
    console.log('🗓️ SpecialistCalendar - useEffect for initialization called');
    fetchSpecialistInfo();
    fetchAppointmentTypes();
    fetchEvents();
  }, [fetchSpecialistInfo, fetchAppointmentTypes, fetchEvents]);

  // Listen for custom calendar refresh events
  useEffect(() => {
    const handleCalendarRefresh = () => {
      console.log('🔄 Custom calendar refresh event received');
      fetchEvents();
    };

    window.addEventListener('calendar-refresh', handleCalendarRefresh);
    
    return () => {
      window.removeEventListener('calendar-refresh', handleCalendarRefresh);
    };
  }, [fetchEvents]);

  // Set up real-time subscriptions for calendar updates
  useEffect(() => {
    if (!specialistId) return;

    console.log('🔄 SpecialistCalendar - Setting up real-time subscriptions');

    // Create a channel for real-time updates
    const channel = supabase
      .channel('calendar-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_appointments',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('🔄 SpecialistCalendar - Appointment changed:', payload);
          fetchEvents();
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
          console.log('🔄 SpecialistCalendar - Schedule changed:', payload);
          fetchEvents();
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
          console.log('🔄 SpecialistCalendar - Availability exception changed:', payload);
          fetchEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_appointments',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('🔄 SpecialistCalendar - Scheduled appointment changed:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 SpecialistCalendar - Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [specialistId, fetchEvents]);

  // Enhanced event style getter with dynamic color coding
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const baseStyle = {
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '12px',
      fontWeight: '500'
    };

    switch (event.resource.type) {
      case 'availability':
        // Available time slots - green with dashed border
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#10b981', // Green for available
            border: '2px dashed #059669',
            opacity: 0.7
          }
        };
      case 'appointment':
        // Appointments with users - different colors based on status
        const appointmentColor = event.resource.status === 'confirmed' ? '#3b82f6' : 
                                event.resource.status === 'in_progress' ? '#8b5cf6' : 
                                '#6b7280';
        return {
          style: {
            ...baseStyle,
            backgroundColor: appointmentColor,
            border: `1px solid ${appointmentColor}`
          }
        };
      case 'exception':
        // Blocked time - different colors for different reasons
        const hasUser = event.resource.userId;
        const blockColor = hasUser ? '#f59e0b' : '#ef4444'; // Yellow for user-blocked, red for personal
        return {
          style: {
            ...baseStyle,
            backgroundColor: blockColor,
            border: `1px solid ${blockColor}`,
            opacity: 0.8
          }
        };
      case 'recurring_pattern':
        // Recurring patterns - with striped pattern effect
        return {
          style: {
            ...baseStyle,
            backgroundColor: event.resource.color || '#f97316',
            border: `2px dotted ${event.resource.color || '#f97316'}`,
            opacity: 0.85,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 6px)'
          }
        };
      default:
        return { 
          style: {
            ...baseStyle,
            backgroundColor: '#6b7280' // Gray for unknown types
          }
        };
    }
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {specialistName ? `${specialistName}'s Calendar` : 'Loading Calendar...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading calendar...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {specialistName ? `${specialistName}'s Calendar` : 'Specialist Calendar'}
            </CardTitle>
            <div className="flex flex-wrap gap-2 pt-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  console.log('🗓️ Refresh button clicked');
                  fetchEvents();
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <SetAvailabilityDialog 
                specialistId={specialistId}
                appointmentTypes={appointmentTypes}
                onSuccess={() => {
                  console.log('🗓️ Availability set successfully, refreshing events');
                  fetchEvents();
                }}
              />
              <BlockTimeDialog 
                specialistId={specialistId}
                onSuccess={() => {
                  console.log('🗓️ Time blocked successfully, refreshing events');
                  fetchEvents();
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Available Time
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Scheduled Appointments
                </Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Blocked (User Meeting)
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Personal Block
                </Badge>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Recurring Patterns
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  In Progress
                </Badge>
              </div>
              
              <div className="calendar-container" style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  view={selectedView}
                  onView={setSelectedView}
                  date={selectedDate}
                  onNavigate={setSelectedDate}
                  eventPropGetter={eventStyleGetter}
                  views={[Views.MONTH, Views.WEEK, Views.DAY]}
                  step={30}
                  showMultiDayTimes
                  components={{
                    toolbar: (props) => (
                      <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              props.onNavigate('PREV');
                              console.log('🗓️ Calendar navigation: PREV');
                            }}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              props.onNavigate('TODAY');
                              console.log('🗓️ Calendar navigation: TODAY');
                            }}
                          >
                            Today
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              props.onNavigate('NEXT');
                              console.log('🗓️ Calendar navigation: NEXT');
                            }}
                          >
                            Next
                          </Button>
                        </div>
                        
                        <div className="font-semibold text-lg">
                          {props.label}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant={selectedView === Views.MONTH ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedView(Views.MONTH);
                              console.log('🗓️ Calendar view changed to: MONTH');
                            }}
                          >
                            Month
                          </Button>
                          <Button
                            variant={selectedView === Views.WEEK ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedView(Views.WEEK);
                              console.log('🗓️ Calendar view changed to: WEEK');
                            }}
                          >
                            Week
                          </Button>
                          <Button
                            variant={selectedView === Views.DAY ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedView(Views.DAY);
                              console.log('🗓️ Calendar view changed to: DAY');
                            }}
                          >
                            Day
                          </Button>
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
}
