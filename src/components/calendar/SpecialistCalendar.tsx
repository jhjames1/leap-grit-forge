import { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, isSameDay, startOfDay, endOfDay } from 'date-fns';
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
    type: 'availability' | 'appointment' | 'exception';
    status?: string;
    appointmentType?: string;
    userId?: string;
    color?: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedView, setSelectedView] = useState<View>(Views.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch appointment types
  const fetchAppointmentTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
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

  // Fetch calendar events (schedules, appointments, exceptions)
  const fetchEvents = useCallback(async () => {
    if (!user || !specialistId) return;

    try {
      setLoading(true);
      const events: CalendarEvent[] = [];

      // Fetch regular schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('specialist_schedules')
        .select(`
          *,
          appointment_types (
            name,
            color
          )
        `)
        .eq('specialist_id', specialistId)
        .eq('is_active', true);

      if (schedulesError) throw schedulesError;

      // Convert schedules to recurring events for current week/month
      schedules?.forEach(schedule => {
        const startDate = startOfDay(selectedDate);
        const endDate = endOfDay(addHours(startDate, 24 * 7)); // Show week's events
        
        // Create recurring events based on day_of_week
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (getDay(d) === schedule.day_of_week) {
            const startTime = new Date(d);
            const [hours, minutes] = schedule.start_time.split(':');
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const endTime = new Date(d);
            const [endHours, endMinutes] = schedule.end_time.split(':');
            endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

            events.push({
              id: `schedule-${schedule.id}-${d.getTime()}`,
              title: `Available - ${schedule.appointment_types?.name || 'General'}`,
              start: startTime,
              end: endTime,
              resource: {
                type: 'availability',
                appointmentType: schedule.appointment_types?.name,
                color: schedule.appointment_types?.color || '#10B981'
              }
            });
          }
        }
      });

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
        .gte('scheduled_start', startOfDay(selectedDate).toISOString())
        .lte('scheduled_end', endOfDay(addHours(selectedDate, 24 * 7)).toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress']);

      if (appointmentsError) throw appointmentsError;

      appointments?.forEach(appointment => {
        events.push({
          id: `appointment-${appointment.id}`,
          title: `${appointment.appointment_types?.name || 'Appointment'} - Client`,
          start: new Date(appointment.scheduled_start),
          end: new Date(appointment.scheduled_end),
          resource: {
            type: 'appointment',
            status: appointment.status,
            appointmentType: appointment.appointment_types?.name,
            userId: appointment.user_id,
            color: appointment.appointment_types?.color || '#3B82F6'
          }
        });
      });

      // Fetch availability exceptions
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', startOfDay(selectedDate).toISOString())
        .lte('end_time', endOfDay(addHours(selectedDate, 24 * 7)).toISOString());

      if (exceptionsError) throw exceptionsError;

      exceptions?.forEach(exception => {
        events.push({
          id: `exception-${exception.id}`,
          title: `${exception.exception_type === 'unavailable' ? 'Unavailable' : 'Special Hours'} - ${exception.reason || 'No reason'}`,
          start: new Date(exception.start_time),
          end: new Date(exception.end_time),
          resource: {
            type: 'exception',
            color: exception.exception_type === 'unavailable' ? '#EF4444' : '#F59E0B'
          }
        });
      });

      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, specialistId, selectedDate, toast]);

  // Handle slot selection (for creating new availability)
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    console.log('Selected slot:', { start, end });
    // TODO: Open modal to create new availability block
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    console.log('Selected event:', event);
    // TODO: Open modal to edit/view event details
  }, []);

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { resource } = event;
    
    let backgroundColor = resource.color || '#3B82F6';
    let border = '1px solid ' + backgroundColor;
    
    if (resource.type === 'availability') {
      backgroundColor = resource.color || '#10B981';
      border = '1px dashed ' + backgroundColor;
    } else if (resource.type === 'exception') {
      backgroundColor = resource.color || '#EF4444';
    }

    return {
      style: {
        backgroundColor,
        border,
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        opacity: resource.type === 'availability' ? 0.7 : 1,
      }
    };
  }, []);

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV')}
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT')}
        >
          →
        </Button>
      </div>
      
      <h2 className="text-lg font-semibold">{label}</h2>
      
      <div className="flex gap-2">
        <Button
          variant={view === Views.WEEK ? "default" : "outline"}
          size="sm"
          onClick={() => onView(Views.WEEK)}
        >
          Week
        </Button>
        <Button
          variant={view === Views.MONTH ? "default" : "outline"}
          size="sm"
          onClick={() => onView(Views.MONTH)}
        >
          Month
        </Button>
      </div>
    </div>
  );

  // Initialize data
  useEffect(() => {
    fetchAppointmentTypes();
    fetchEvents();
  }, [fetchAppointmentTypes, fetchEvents]);

  // Refetch events when date changes
  useEffect(() => {
    fetchEvents();
  }, [selectedDate, fetchEvents]);

  const calendarStyle = useMemo(() => ({
    height: 600,
  }), []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-500 border-dashed opacity-70"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-sm">Special Hours</span>
              </div>
            </div>

            {/* Calendar */}
            <div className="calendar-container">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={calendarStyle}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                popup
                views={[Views.WEEK, Views.MONTH]}
                view={selectedView}
                onView={setSelectedView}
                date={selectedDate}
                onNavigate={setSelectedDate}
                eventPropGetter={eventStyleGetter}
                components={{
                  toolbar: CustomToolbar,
                }}
                step={15}
                timeslots={4}
                min={new Date(0, 0, 0, 6, 0, 0)}
                max={new Date(0, 0, 0, 22, 0, 0)}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button size="sm" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Set Availability
              </Button>
              <Button size="sm" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Block Time
              </Button>
              <Button size="sm" variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Set Location
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DndProvider>
  );
}