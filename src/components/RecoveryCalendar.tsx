import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Flame, X, ChevronLeft, ChevronRight, Target, ArrowLeft, CheckCircle2, Clock, Users } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackingManager } from '@/utils/trackingManager';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';

interface RecoveryCalendarProps {
  onNavigate?: (page: string) => void;
}

interface ScheduledAppointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  appointment_type_id: string;
  meeting_type: string;
  notes?: string;
}

const RecoveryCalendar = ({ onNavigate }: RecoveryCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCompletedDay, setSelectedCompletedDay] = useState<number | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ScheduledAppointment | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [appointments, setAppointments] = useState<ScheduledAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const { userData } = useUserData();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Load user appointments
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user) return;
      
      setAppointmentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('scheduled_appointments')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('scheduled_start', startOfMonth(currentDate).toISOString())
          .lte('scheduled_end', endOfMonth(currentDate).toISOString())
          .order('scheduled_start');

        if (error) {
          console.error('Error loading appointments:', error);
        } else {
          setAppointments(data || []);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    loadAppointments();
  }, [user, currentDate]);

  // Force refresh when journey progress changes
  useEffect(() => {
    if (userData?.journeyProgress?.completedDays) {
      console.log('Calendar refreshing due to completed days change:', userData.journeyProgress.completedDays);
    }
  }, [userData?.journeyProgress?.completedDays]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): ScheduledAppointment[] => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.scheduled_start), date)
    );
  };

  // Get journey day that was completed on a specific calendar date
  const getJourneyDayCompletedOnDate = (date: Date): number | null => {
    const completionDates = userData?.journeyProgress?.completionDates || {};
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Find which journey day was completed on this calendar date
    for (const [dayStr, dateStr] of Object.entries(completionDates)) {
      const completionDate = new Date(dateStr as string);
      completionDate.setHours(0, 0, 0, 0);
      
      if (completionDate.getTime() === targetDate.getTime()) {
        return parseInt(dayStr);
      }
    }
    
    return null;
  };

  // Get the journey start date (earliest completion)
  const getJourneyStartDate = (): Date | null => {
    const completionDates = userData?.journeyProgress?.completionDates || {};
    
    if (Object.keys(completionDates).length === 0) return null;
    
    // Find the earliest completion date
    const allDates = Object.values(completionDates)
      .map(dateStr => new Date(dateStr as string))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (allDates.length > 0) {
      const earliest = new Date(allDates[0]);
      earliest.setHours(0, 0, 0, 0);
      return earliest;
    }
    
    return null;
  };

  const getDayStatus = (date: Date): 'completed' | 'missed' | 'today' | 'future' | 'appointment' => {
    const dateAppointments = getAppointmentsForDate(date);
    const completedJourneyDay = getJourneyDayCompletedOnDate(date);
    const journeyStartDate = getJourneyStartDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Check for appointments first
    if (dateAppointments.length > 0) {
      return 'appointment';
    }
    
    // Check if a journey day was completed on this date
    if (completedJourneyDay !== null) {
      return 'completed';
    }
    
    // Future dates
    if (targetDate > today) {
      return 'future';
    }
    
    // Today without completion
    if (targetDate.getTime() === today.getTime()) {
      return 'today';
    }
    
    // Past dates: check if journey had started
    if (journeyStartDate && targetDate >= journeyStartDate) {
      // Journey was active on this date, so it's a missed day
      return 'missed';
    }
    
    // Before journey started - neutral
    return 'future';
  };

  const handleDayClick = (date: Date) => {
    const completedJourneyDay = getJourneyDayCompletedOnDate(date);
    const dateAppointments = getAppointmentsForDate(date);
    
    // Show appointment details if there are appointments
    if (dateAppointments.length > 0) {
      setSelectedAppointment(dateAppointments[0]); // Show first appointment
      setShowAppointmentDetails(true);
    }
    // Show completed day details
    else if (completedJourneyDay !== null) {
      setSelectedCompletedDay(completedJourneyDay);
      setShowDayDetails(true);
    }
  };

  const getDayIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="bg-emerald-500 p-1 rounded-sm">
            <Flame className="text-white" size={10} />
          </div>
        );
      case 'appointment':
        return (
          <div className="bg-blue-500 p-1 rounded-sm">
            <Users className="text-white" size={8} />
          </div>
        );
      case 'missed':
        return (
          <div className="bg-red-500 p-1 rounded-sm">
            <X className="text-white" size={8} />
          </div>
        );
      case 'today':
        return (
          <div className="bg-primary p-1 rounded-sm">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      default:
        return null;
    }
  };

  const getDayClasses = (status: string) => {
    const baseClasses = "w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-emerald-100 border border-emerald-200 text-emerald-700 cursor-pointer hover:scale-105`;
      case 'appointment':
        return `${baseClasses} bg-blue-100 border border-blue-200 text-blue-700 cursor-pointer hover:scale-105`;
      case 'missed':
        return `${baseClasses} bg-red-50 border border-red-100 text-red-600`;
      case 'today':
        return `${baseClasses} bg-primary text-primary-foreground border-2 border-primary shadow-lg`;
      case 'future':
        return `${baseClasses} bg-muted text-muted-foreground`;
      default:
        return `${baseClasses} bg-muted text-muted-foreground`;
    }
  };

  // Helper functions to parse user data for specific days
  const getActivitiesForDay = (day: number): Array<{title: string, activity: string, tool: string, completionDate: string}> => {
    const journeyData = require('../data/journeyData.json');
    const coreJourney = journeyData.coreJourneys[0];
    const dayData = coreJourney.days.find((d: any) => d.day === day);
    
    if (!dayData) return [];
    
    const completedDays = userData?.journeyProgress?.completedDays || [];
    if (!completedDays.includes(day)) return [];
    
    const completionDate = userData?.journeyProgress?.completionDates?.[day];
    return [{
      title: dayData.title,
      activity: dayData.activity,
      tool: dayData.tool,
      completionDate: completionDate ? new Date(completionDate).toLocaleDateString() : 'Unknown date'
    }];
  };

  const getJournalingResponsesForDay = (day: number): Array<{title: string, content: string}> => {
    const responses: Array<{title: string, content: string}> = [];
    const journeyResponses = userData?.journeyResponses || {};
    
    Object.keys(journeyResponses).forEach(key => {
      if (key.startsWith(`day_${day}_`) && typeof journeyResponses[key] === 'string') {
        const activityType = key.replace(`day_${day}_`, '');
        const content = journeyResponses[key] as string;
        
        if (content && content.length > 0) {
          switch (activityType) {
            case 'daily_reflection':
              responses.push({title: 'Daily Reflection', content});
              break;
            case 'reflection':
              responses.push({title: 'Reflection', content});
              break;
            case 'trigger_identification':
              responses.push({title: 'Trigger Identification', content});
              break;
            case 'gratitude_log':
              responses.push({title: 'Gratitude Entry', content});
              break;
            default:
              if (activityType.includes('text') || activityType.includes('reflection') || activityType.includes('journal')) {
                responses.push({
                  title: activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  content
                });
              }
          }
        }
      }
    });
    
    return responses;
  };

  const getToolsUsedForDay = (day: number): string[] => {
    const tools: string[] = [];
    const journeyResponses = userData?.journeyResponses || {};
    
    Object.keys(journeyResponses).forEach(key => {
      if (key.startsWith(`day_${day}_`)) {
        const activityType = key.replace(`day_${day}_`, '');
        switch (activityType) {
          case 'trigger_identification':
            tools.push('Trigger Identifier');
            break;
          case 'urge_tracking':
            tools.push('Urge Tracker');
            break;
          case 'breathing_exercise':
            tools.push('Breathing Exercise');
            break;
          case 'gratitude_log':
            tools.push('Gratitude Log');
            break;
          case 'peer_support':
            tools.push('Peer Support');
            break;
        }
      }
    });
    
    return tools;
  };

  // Calculate stats from journey progress
  const completedJourneyDays = userData?.journeyProgress?.completedDays || [];
  const completedDaysCount = completedJourneyDays.length;
  const totalJourneyDays = 90;
  const completionRate = Math.round((completedDaysCount / totalJourneyDays) * 100);
  const upcomingAppointments = appointments.filter(apt => new Date(apt.scheduled_start) >= new Date()).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('journey')}
              className="p-2 mr-4"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">YOUR</span><span className="font-fjalla font-extrabold italic">CALENDAR</span>
              </h1>
              <p className="text-muted-foreground font-oswald">{t('calendar.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-2 rounded-sm">
                <Flame className="text-white" size={16} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{completedDaysCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('calendar.completedDays')}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-sm">
                <Target className="text-primary-foreground" size={16} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('calendar.completionRate')}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-sm">
                <Clock className="text-white" size={16} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{upcomingAppointments}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Upcoming
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-sm mb-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2"
            >
              <ChevronLeft size={20} />
            </Button>
            
            <h2 className="font-fjalla font-bold text-lg uppercase tracking-wide">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, index) => {
              const status = getDayStatus(date);
              const dayNumber = date.getDate();
              
              return (
                <div 
                  key={index} 
                  className="flex justify-center p-1"
                  onClick={() => handleDayClick(date)}
                >
                  <div className={getDayClasses(status)}>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] leading-none">{dayNumber}</span>
                      <div className="mt-0.5">
                        {getDayIcon(status)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Legend */}
        <Card className="bg-card p-4 rounded-lg border-0 shadow-sm mb-6">
          <h3 className="font-fjalla font-bold text-base uppercase tracking-wide mb-3">
            {t('calendar.legend')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-500 p-1 rounded-sm">
                <Flame className="text-white" size={12} />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('calendar.completedDay')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 p-1 rounded-sm">
                <Users className="text-white" size={10} />
              </div>
              <span className="text-sm text-muted-foreground">
                Appointment
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-red-500 p-1 rounded-sm">
                <X className="text-white" size={10} />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('calendar.missedDay')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-1 rounded-sm">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('calendar.today')}
              </span>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card 
          className="bg-primary text-primary-foreground p-6 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors duration-200 shadow-sm"
          onClick={() => onNavigate?.('journey')}
        >
          <div className="text-center">
            <h3 className="font-fjalla font-bold text-lg mb-2 uppercase tracking-wide">
              {t('calendar.cta')}
            </h3>
            <p className="text-primary-foreground/80 text-sm">
              {t('calendar.ctaSubtitle')}
            </p>
          </div>
        </Card>
      </div>

      {/* Completed Day Details Dialog */}
      <Dialog open={showDayDetails} onOpenChange={setShowDayDetails}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Day {selectedCompletedDay} - Completed
            </DialogTitle>
            <DialogDescription>
              Your activities and reflections from this day
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Activity Summary */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Journey Activities Completed</span>
              </div>
               <div className="space-y-3">
                 {selectedCompletedDay && getActivitiesForDay(selectedCompletedDay).map((activityData, index) => (
                   <div key={index} className="bg-white p-3 rounded border border-emerald-100">
                     <div className="flex items-center gap-2 mb-2">
                       <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                       <span className="text-sm font-medium text-emerald-800">{activityData.title}</span>
                     </div>
                     <p className="text-sm text-emerald-700 mb-2">{activityData.activity}</p>
                     <div className="flex items-center gap-4 text-xs text-emerald-600">
                       <span>Tool: {activityData.tool}</span>
                       <span>Completed: {activityData.completionDate}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Journaling Responses */}
            {selectedCompletedDay && getJournalingResponsesForDay(selectedCompletedDay).length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Your Reflections</span>
                </div>
                <div className="space-y-3">
                  {getJournalingResponsesForDay(selectedCompletedDay).map((response, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-blue-100">
                      <p className="font-medium text-blue-800 text-sm mb-1">{response.title}</p>
                      <p className="text-blue-700 text-sm italic">"{response.content}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tools Used */}
            {selectedCompletedDay && getToolsUsedForDay(selectedCompletedDay).length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-purple-800">Recovery Tools Used</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getToolsUsedForDay(selectedCompletedDay).map((tool, index) => (
                    <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={() => setShowDayDetails(false)} 
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              Your scheduled appointment information
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Scheduled Appointment</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Date: </span>
                    <span className="text-blue-700">
                      {format(new Date(selectedAppointment.scheduled_start), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Time: </span>
                    <span className="text-blue-700">
                      {format(new Date(selectedAppointment.scheduled_start), 'h:mm a')} - {format(new Date(selectedAppointment.scheduled_end), 'h:mm a')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Type: </span>
                    <span className="text-blue-700 capitalize">
                      {selectedAppointment.meeting_type}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Status: </span>
                    <span className="text-blue-700 capitalize">
                      {selectedAppointment.status}
                    </span>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <span className="font-medium text-blue-800">Notes: </span>
                      <span className="text-blue-700">{selectedAppointment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => setShowAppointmentDetails(false)} 
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecoveryCalendar;
