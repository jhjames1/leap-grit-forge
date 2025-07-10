
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Flame, X, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackingManager } from '@/utils/trackingManager';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';

interface RecoveryCalendarProps {
  onNavigate?: (page: string) => void;
}

const RecoveryCalendar = ({ onNavigate }: RecoveryCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, 'completed' | 'missed'>>({});
  const { userData } = useUserData();
  const { t } = useLanguage();

  useEffect(() => {
    // Load calendar data from tracking manager
    const data = trackingManager.getCalendarData(3); // Last 3 months
    setCalendarData(data);
  }, [userData]);

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

  const getDayStatus = (date: Date): 'completed' | 'missed' | 'today' | 'future' => {
    const dateString = date.toISOString().split('T')[0];
    
    if (isToday(date)) return 'today';
    if (date > new Date()) return 'future';
    
    return calendarData[dateString] || 'missed';
  };

  const getDayIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Flame className="text-orange-500" size={16} />;
      case 'missed':
        return <X className="text-red-500" size={12} />;
      case 'today':
        return <div className="w-3 h-3 bg-primary rounded-full" />;
      default:
        return null;
    }
  };

  const getDayClasses = (status: string) => {
    const baseClasses = "w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-orange-100 border border-orange-200 text-orange-700`;
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

  // Calculate stats
  const completedDays = Object.values(calendarData).filter(status => status === 'completed').length;
  const totalTrackedDays = Object.keys(calendarData).length;
  const completionRate = totalTrackedDays > 0 ? Math.round((completedDays / totalTrackedDays) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">RECOVERY</span><span className="font-fjalla font-extrabold italic">CALENDAR</span>
          </h1>
          <p className="text-muted-foreground font-oswald">{t('calendar.subtitle') || 'Track your daily progress'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Flame className="text-white" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{completedDays}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('calendar.completedDays') || 'Completed Days'}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Target className="text-primary-foreground" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('calendar.completionRate') || 'Success Rate'}
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
                <div key={index} className="flex justify-center p-1">
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
            {t('calendar.legend') || 'Legend'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Flame className="text-orange-500" size={16} />
              <span className="text-sm text-muted-foreground">
                {t('calendar.completedDay') || 'Completed day'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <X className="text-red-500" size={12} />
              <span className="text-sm text-muted-foreground">
                {t('calendar.missedDay') || 'Missed day'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-sm text-muted-foreground">
                {t('calendar.today') || 'Today'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted rounded-full" />
              <span className="text-sm text-muted-foreground">
                {t('calendar.futureDay') || 'Future day'}
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
              {t('calendar.cta') || 'Take the next LEAP today'}
            </h3>
            <p className="text-primary-foreground/80 text-sm">
              {t('calendar.ctaSubtitle') || 'Continue your recovery journey'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecoveryCalendar;
