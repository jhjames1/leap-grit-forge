
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Settings, Clock, Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleManagementModal from './ScheduleManagementModal';
import { format } from 'date-fns';

const localizer = momentLocalizer(moment);

// Create the drag and drop enabled calendar
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  type: 'appointment' | 'availability' | 'blocked';
}

interface EnhancedSpecialistCalendarProps {
  specialistId: string;
}

const EnhancedSpecialistCalendar = ({ specialistId }: EnhancedSpecialistCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Set default view hours (7 AM to 6 PM) but allow full 24-hour scrolling
  const minTime = new Date();
  minTime.setHours(0, 0, 0); // Allow scrolling up to 12 AM
  
  const maxTime = new Date();
  maxTime.setHours(23, 59, 59); // Allow scrolling down to 11:59 PM

  // Default scroll position to 7 AM
  const scrollToTime = new Date();
  scrollToTime.setHours(7, 0, 0);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Load appointments without profiles join
      const { data: appointments, error: appointmentsError } = await supabase
        .from('specialist_appointments')
        .select(`
          *,
          appointment_types(name, color)
        `)
        .eq('specialist_id', specialistId)
        .gte('scheduled_start', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
        .lte('scheduled_end', new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString());

      if (appointmentsError) throw appointmentsError;

      // Load availability exceptions (blocked time)
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
        .lte('end_time', new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString());

      if (exceptionsError) throw exceptionsError;

      // Convert to calendar events
      const calendarEvents: CalendarEvent[] = [];

      // Add appointments (without user name since we don't have profiles relation)
      appointments?.forEach(apt => {
        calendarEvents.push({
          id: apt.id,
          title: `${apt.appointment_types?.name || 'Appointment'}`,
          start: new Date(apt.scheduled_start),
          end: new Date(apt.scheduled_end),
          type: 'appointment',
          resource: {
            ...apt,
            color: apt.appointment_types?.color || '#3B82F6'
          }
        });
      });

      // Add blocked time
      exceptions?.forEach(exc => {
        if (exc.exception_type === 'unavailable') {
          calendarEvents.push({
            id: exc.id,
            title: exc.reason || 'Blocked Time',
            start: new Date(exc.start_time),
            end: new Date(exc.end_time),
            type: 'blocked',
            resource: exc
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Error Loading Calendar",
        description: "Could not load calendar data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (specialistId) {
      loadCalendarData();
    }
  }, [specialistId, currentDate]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3B82F6';
    let borderColor = '#3B82F6';
    
    switch (event.type) {
      case 'appointment':
        backgroundColor = event.resource?.color || '#10B981';
        borderColor = event.resource?.color || '#10B981';
        break;
      case 'blocked':
        backgroundColor = '#EF4444';
        borderColor = '#EF4444';
        break;
      case 'availability':
        backgroundColor = '#F59E0B';
        borderColor = '#F59E0B';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    console.log('Selected slot:', { start, end });
    // Handle slot selection for creating new appointments or blocking time
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Selected event:', event);
    // Handle event selection for editing
  };

  const handleEventResize = async ({ event, start, end }: { event: CalendarEvent, start: Date, end: Date }) => {
    console.log('🔄 Event resize:', { event, start, end });
    
    // Only allow resizing of appointments
    if (event.type !== 'appointment') {
      toast({
        title: "Cannot resize this event",
        description: "Only scheduled appointments can be resized",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update the appointment in the database
      const { error } = await supabase
        .from('specialist_appointments')
        .update({
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Appointment Updated",
        description: "The appointment time has been updated successfully",
      });

      // Refresh events to show the updated time
      loadCalendarData();
    } catch (error: any) {
      console.error('Error resizing appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment time",
        variant: "destructive"
      });
    }
  };

  const formats = {
    timeGutterFormat: (date: Date) => format(date, 'h a'),
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
      `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
      `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
    agendaTimeFormat: (date: Date) => format(date, 'h:mm a'),
    dayFormat: (date: Date) => format(date, 'eee M/d'),
    dayHeaderFormat: (date: Date) => format(date, 'eeee, MMM d'),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => 
      `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`,
    monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy'),
    weekdayFormat: (date: Date) => format(date, 'eee'),
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Specialist Calendar</h3>
          </div>
          
          {/* View Controls */}
          <div className="flex gap-1">
            {(['month', 'week', 'work_week', 'day'] as View[]).map((view) => (
              <Button
                key={view}
                variant={currentView === view ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView(view)}
                className="capitalize"
              >
                {view === 'work_week' ? 'Work Week' : view}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Appointments</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Blocked</span>
            </div>
          </div>

          {/* Schedule Management */}
          <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Manage Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Management</DialogTitle>
              </DialogHeader>
              <ScheduleManagementModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                specialistId={specialistId}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          <div className="calendar-container" style={{ height: '600px' }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onEventResize={handleEventResize}
              selectable
              resizable
              eventPropGetter={eventStyleGetter}
              formats={formats}
              min={minTime}
              max={maxTime}
              scrollToTime={scrollToTime}
              step={15}
              timeslots={4}
              defaultView="week"
              views={['month', 'week', 'work_week', 'day']}
              toolbar={true}
              components={{
                toolbar: (props) => (
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onNavigate('PREV')}
                      >
                        ‹
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onNavigate('NEXT')}
                      >
                        ›
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onNavigate('TODAY')}
                      >
                        Today
                      </Button>
                    </div>
                    
                    <h2 className="text-lg font-semibold">
                      {props.label}
                    </h2>
                    
                    <div className="text-sm text-muted-foreground">
                      Default View: 7:00 AM - 6:00 PM • Scroll for full 24h access
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Appointments */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => 
                    e.type === 'appointment' && 
                    e.start.toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* This Week's Appointments */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => {
                    if (e.type !== 'appointment') return false;
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return e.start >= weekStart && e.start <= weekEnd;
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Available Hours Today */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Hours Today</p>
                <p className="text-2xl font-bold">
                  {9 - events.filter(e => 
                    (e.type === 'appointment' || e.type === 'blocked') && 
                    e.start.toDateString() === new Date().toDateString()
                  ).length}h
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSpecialistCalendar;
