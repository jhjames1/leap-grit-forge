import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, addDays, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BlockTimeManager from './BlockTimeManager';

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
  allDay?: boolean;
  resource?: any;
}

interface SpecialistCalendarProps {
  specialistId: string;
  onBlockTimeChange?: () => void;
}

const SpecialistCalendar = ({ specialistId, onBlockTimeChange }: SpecialistCalendarProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = startOfDay(date);
      const end = endOfDay(addDays(date, 7));

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('specialist_appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('scheduled_start', start.toISOString())
        .lte('scheduled_end', end.toISOString());

      if (appointmentsError) throw appointmentsError;

      // Fetch blocked time
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString());

      if (exceptionsError) throw exceptionsError;

      // Fetch working hours
      const { data: settings, error: settingsError } = await supabase
        .from('specialist_calendar_settings')
        .select('working_hours')
        .eq('specialist_id', specialistId)
        .single();

      if (settingsError) throw settingsError;

      const calendarEvents: CalendarEvent[] = [];

      // Add appointments
      if (appointments) {
        appointments.forEach(appointment => {
          calendarEvents.push({
            id: appointment.id,
            title: `Appointment - ${appointment.user_id}`,
            start: new Date(appointment.scheduled_start),
            end: new Date(appointment.scheduled_end),
            resource: { type: 'appointment' }
          });
        });
      }

      // Add blocked time
      if (exceptions) {
        exceptions.forEach(exception => {
          calendarEvents.push({
            id: exception.id,
            title: `Blocked Time - ${exception.reason}`,
            start: new Date(exception.start_time),
            end: new Date(exception.end_time),
            resource: { type: 'blocked' }
          });
        });
      }

      // Add working hours as background events
      if (settings?.working_hours) {
        const workingHours = settings.working_hours;
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Generate working hour blocks for each day in the current week
        for (let i = 0; i < 7; i++) {
          const currentDate = addDays(start, i);
          const dayName = dayNames[currentDate.getDay()];
          const daySettings = workingHours[dayName];
          
          if (daySettings?.enabled) {
            const [startHour, startMinute] = daySettings.start.split(':').map(Number);
            const [endHour, endMinute] = daySettings.end.split(':').map(Number);
            
            const workingStart = new Date(currentDate);
            workingStart.setHours(startHour, startMinute, 0, 0);
            
            const workingEnd = new Date(currentDate);
            workingEnd.setHours(endHour, endMinute, 0, 0);
            
            calendarEvents.push({
              id: `working-${dayName}-${currentDate.toISOString()}`,
              title: 'Available Hours',
              start: workingStart,
              end: workingEnd,
              resource: { type: 'working_hours' }
            });
          }
        }
      }

      setEvents(calendarEvents);
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
  };

  const handleBlockTimeChange = () => {
    console.log('Block time changed in calendar, refreshing events');
    fetchEvents();
    onBlockTimeChange?.();
  };

  useEffect(() => {
    fetchEvents();
  }, [specialistId, date]);

  const eventStyleGetter = (event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
    let backgroundColor = '#3182CE';
    let opacity = 0.8;
    let color = 'white';
    let border = '0px';
    
    if (event.resource?.type === 'working_hours') {
      backgroundColor = '#10B981'; // Green for available hours
      opacity = 0.3;
      color = '#065F46';
      border = '1px solid #10B981';
    } else if (event.title.startsWith('Blocked Time')) {
      backgroundColor = '#E53E3E'; // Red for blocked time
    } else if (event.resource?.type === 'appointment') {
      backgroundColor = '#3182CE'; // Blue for appointments
    }

    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity,
      color,
      border,
      display: 'block'
    };
    return {
      style: style
    };
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="block-time">Block Time</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="font-fjalla">Your Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onView={setView}
                view={view}
                date={date}
                onNavigate={setDate}
                eventPropGetter={eventStyleGetter}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="block-time">
          <BlockTimeManager 
            specialistId={specialistId} 
            onBlockTimeChange={handleBlockTimeChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpecialistCalendar;
