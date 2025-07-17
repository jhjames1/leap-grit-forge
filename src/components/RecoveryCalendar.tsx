
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Flame, X, ChevronLeft, ChevronRight, Target, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackingManager } from '@/utils/trackingManager';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';

interface RecoveryCalendarProps {
  onNavigate?: (page: string) => void;
}

const RecoveryCalendar = ({ onNavigate }: RecoveryCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCompletedDay, setSelectedCompletedDay] = useState<number | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const { userData } = useUserData();
  const { t } = useLanguage();

  // Force refresh when journey progress changes
  useEffect(() => {
    if (userData?.journeyProgress?.completedDays) {
      // Component will re-render when completedDays changes
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

  // Get journey day from calendar date
  const getJourneyDayFromDate = (date: Date): number | null => {
    // Get user's recovery start date from preferences or default to today minus max completed day
    const completedDays = userData?.journeyProgress?.completedDays || [];
    const maxCompletedDay = completedDays.length > 0 ? Math.max(...completedDays) : 0;
    const today = new Date();
    
    // Calculate journey start date based on completed days
    // If user has completed day 1, then today should be day 1 + days since completion
    let journeyStartDate = new Date(today);
    if (maxCompletedDay > 0) {
      journeyStartDate.setDate(today.getDate() - maxCompletedDay + 1);
    }
    
    // Calculate journey day from start date
    const daysDiff = Math.floor((date.getTime() - journeyStartDate.getTime()) / (24 * 60 * 60 * 1000));
    const journeyDay = daysDiff + 1;
    
    return journeyDay >= 1 && journeyDay <= 90 ? journeyDay : null;
  };

  const getDayStatus = (date: Date): 'completed' | 'missed' | 'today' | 'future' => {
    const completedDays = userData?.journeyProgress?.completedDays || [];
    const journeyDay = getJourneyDayFromDate(date);
    
    if (isToday(date)) {
      // Check if today is completed
      return journeyDay && completedDays.includes(journeyDay) ? 'completed' : 'today';
    }
    
    if (date > new Date()) return 'future';
    
    if (!journeyDay) return 'missed';
    
    return completedDays.includes(journeyDay) ? 'completed' : 'missed';
  };

  const handleDayClick = (date: Date) => {
    const journeyDay = getJourneyDayFromDate(date);
    const completedDays = userData?.journeyProgress?.completedDays || [];
    
    // Only show details for completed days
    if (journeyDay && completedDays.includes(journeyDay)) {
      setSelectedCompletedDay(journeyDay);
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

  // Calculate stats from journey progress
  const completedJourneyDays = userData?.journeyProgress?.completedDays || [];
  const completedDaysCount = completedJourneyDays.length;
  const totalJourneyDays = 90; // Total journey days
  const completionRate = Math.round((completedDaysCount / totalJourneyDays) * 100);

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
        <div className="grid grid-cols-2 gap-4 mb-6">
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
            <div className="flex items-center space-x-2">
              <div className="bg-muted p-1 rounded-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('calendar.futureDay')}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Day {selectedCompletedDay} - Completed
            </DialogTitle>
            <DialogDescription>
              Activities completed on this day
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Journey Activity</span>
              </div>
              <p className="text-sm text-emerald-700">
                Day {selectedCompletedDay} journey activity completed successfully!
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Completed on {userData?.journeyProgress?.completionDates?.[selectedCompletedDay || 0] 
                  ? new Date(userData.journeyProgress.completionDates[selectedCompletedDay || 0]).toLocaleDateString()
                  : 'Unknown date'
                }
              </p>
            </div>

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
    </div>
  );
};

export default RecoveryCalendar;
