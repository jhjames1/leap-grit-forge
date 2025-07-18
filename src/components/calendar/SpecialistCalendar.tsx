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

      const { data: appointments, error: appointmentsError } = await supabase
        .from('specialist_appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('scheduled_start', start.toISOString())
        .lte('scheduled_end', end.toISOString());

      if (appointmentsError) throw appointmentsError;

      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString());

      if (exceptionsError) throw exceptionsError;

      const calendarEvents: CalendarEvent[] = [];

      if (appointments) {
        appointments.forEach(appointment => {
          calendarEvents.push({
            id: appointment.id,
            title: `Appointment - ${appointment.user_id}`,
            start: new Date(appointment.scheduled_start),
            end: new Date(appointment.scheduled_end),
          });
        });
      }

      if (exceptions) {
        exceptions.forEach(exception => {
          calendarEvents.push({
            id: exception.id,
            title: `Blocked Time - ${exception.reason}`,
            start: new Date(exception.start_time),
            end: new Date(exception.end_time),
          });
        });
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
    if (event.title.startsWith('Blocked Time')) {
      backgroundColor = '#E53E3E';
    }

    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
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
