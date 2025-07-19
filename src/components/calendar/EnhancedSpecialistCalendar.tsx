import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Settings, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScheduleManagementModal from './ScheduleManagementModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'availability' | 'appointment' | 'exception' | 'tentative' | 'recurring_pattern';
    status?: string;
    appointmentType?: string;
    userId?: string;
    color?: string;
    isRecurring?: boolean;
    patternId?: string;
    proposalId?: string;
  };
}

interface EnhancedSpecialistCalendarProps {
  specialistId: string;
}

export default function EnhancedSpecialistCalendar({ specialistId }: EnhancedSpecialistCalendarProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedView, setSelectedView] = useState<View>(Views.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [specialistName, setSpecialistName] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);

  const fetchSpecialistInfo = useCallback(async () => {
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
      }
    } catch (error) {
      console.error('Error fetching specialist info:', error);
      setSpecialistName('Specialist'); // Fallback name
    }
  }, [specialistId]);

  const fetchAppointmentTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      if (data) setAppointmentTypes(data);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment types",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchEvents = useCallback(async () => {
    if (!specialistId) return;

    try {
      setLoading(true);
      const events: CalendarEvent[] = [];
      const today = new Date();
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

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

      if (schedules) {
        schedules.forEach(schedule => {
          const startTime = new Date(`2000-01-01T${schedule.start_time}`);
          const endTime = new Date(`2000-01-01T${schedule.end_time}`);
          
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

      const { data: exceptions, error: exceptionsError } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_recurring', false)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', endDate.toISOString());

      if (exceptionsError) throw exceptionsError;

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

      const { data: proposals, error: proposalsError } = await supabase
        .from('appointment_proposals')
        .select(`
          *,
          chat_sessions!inner(status)
        `)
        .eq('specialist_id', specialistId)
        .eq('status', 'pending')
        .in('chat_sessions.status', ['waiting', 'active'])
        .gt('expires_at', new Date().toISOString());

      if (proposalsError) throw proposalsError;

      if (proposals) {
        setPendingProposalsCount(proposals.length);
        
        // Fetch user profiles for proposals
        const userIds = proposals.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        
        proposals.forEach(proposal => {
          const startDateTime = new Date(`${proposal.start_date}T${proposal.start_time}`);
          const endDateTime = new Date(startDateTime.getTime() + proposal.duration * 60000);
          
          const userProfile = profiles?.find(p => p.user_id === proposal.user_id);
          const userName = userProfile?.first_name 
            ? `${userProfile.first_name} ${userProfile.last_name?.charAt(0) || ''}.`
            : 'User';

          events.push({
            id: `proposal-${proposal.id}`,
            title: `⏳ PENDING: ${proposal.title} - ${userName}`,
            start: startDateTime,
            end: endDateTime,
            resource: {
              type: 'tentative',
              proposalId: proposal.id,
              color: '#f59e0b' // Yellow/orange for tentative
            }
          });
        });
      }

      console.log('Enhanced calendar events processed:', events);
      setEvents(events);
    } catch (error) {
      console.error('Error fetching enhanced calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [specialistId, toast]);

  useEffect(() => {
    fetchSpecialistInfo();
    fetchAppointmentTypes();
    fetchEvents();
  }, [fetchSpecialistInfo, fetchAppointmentTypes, fetchEvents]);

  useEffect(() => {
    if (!specialistId) return;

    console.log('🔄 SpecialistCalendar - Setting up real-time subscriptions');

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

    return () => {
      console.log('🔄 SpecialistCalendar - Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [specialistId, fetchEvents]);

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
      case 'tentative':
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#f59e0b',
            border: '2px dashed #d97706',
            opacity: 0.8,
            fontStyle: 'italic'
          }
        };
      case 'availability':
        return {
          style: {
            ...baseStyle,
            backgroundColor: '#10b981',
            border: '2px dashed #059669',
            opacity: 0.7
          }
        };
      case 'appointment':
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
        const hasUser = event.resource.userId;
        const blockColor = hasUser ? '#f59e0b' : '#ef4444';
        return {
          style: {
            ...baseStyle,
            backgroundColor: blockColor,
            border: `1px solid ${blockColor}`,
            opacity: 0.8
          }
        };
      case 'recurring_pattern':
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
            backgroundColor: '#6b7280'
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
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {specialistName ? `${specialistName}'s Calendar` : 'Specialist Calendar'}
            {pendingProposalsCount > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                {pendingProposalsCount} Pending Meeting Proposals
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-2 pt-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchEvents}
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              variant="default"
              onClick={() => setShowScheduleModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Schedule
            </Button>
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
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Pending Meeting Proposals
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
                        <Button variant="outline" size="sm" onClick={() => props.onNavigate('PREV')}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => props.onNavigate('TODAY')}>
                          Today
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => props.onNavigate('NEXT')}>
                          Next
                        </Button>
                      </div>
                      
                      <div className="font-semibold text-lg">{props.label}</div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedView === Views.MONTH ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedView(Views.MONTH)}
                        >
                          Month
                        </Button>
                        <Button
                          variant={selectedView === Views.WEEK ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedView(Views.WEEK)}
                        >
                          Week
                        </Button>
                        <Button
                          variant={selectedView === Views.DAY ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedView(Views.DAY)}
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

      <ScheduleManagementModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        specialistId={specialistId}
      />
    </div>
  );
}
