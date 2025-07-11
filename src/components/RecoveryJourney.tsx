import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Play, Clock, Target, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import JourneyDayModal from './JourneyDayModal';
import { logger } from '@/utils/logger';
import { calculateCurrentJourneyDay, getDayStatus } from '@/utils/journeyCalculation';
import { journeyManager } from '@/utils/journeyManager';
import { trackingManager } from '@/utils/trackingManager';
import { notificationManager } from '@/utils/notificationManager';

interface RecoveryJourneyProps {
  onNavigateToHome?: () => void;
}

const RecoveryJourney = ({ onNavigateToHome }: RecoveryJourneyProps = {}) => {
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [forceRender, setForceRender] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [userJourney, setUserJourney] = useState<any>(null);
  const [phaseModifier, setPhaseModifier] = useState<any>(null);
  const { userData, logActivity } = useUserData();
  const { toast } = useToast();
  const { t } = useLanguage();
  const totalDays = 90;
  
  // Initialize user's journey based on their onboarding data
  useEffect(() => {
    logger.debug('Journey initialization check', { 
      userData: !!userData,
      focusAreas: userData?.focusAreas,
      journeyStage: userData?.journeyStage,
      hasUserData: !!userData
    });

    if (userData?.focusAreas && userData?.journeyStage) {
      const journey = journeyManager.getUserJourney(userData.focusAreas);
      const modifier = journeyManager.getPhaseModifier(userData.journeyStage);
      
      setUserJourney(journey);
      setPhaseModifier(modifier);
      
      logger.debug('Journey initialized', { 
        focusAreas: userData.focusAreas,
        journeyStage: userData.journeyStage,
        journeyFound: !!journey,
        modifierFound: !!modifier
      });
    } else if (userData) {
      // If userData exists but missing onboarding data, use defaults
      logger.debug('Using default journey for user missing onboarding data');
      const defaultJourney = journeyManager.getUserJourney(['stress_management']);
      const defaultModifier = journeyManager.getPhaseModifier('foundation');
      
      setUserJourney(defaultJourney);
      setPhaseModifier(defaultModifier);
    }
  }, [userData?.focusAreas, userData?.journeyStage, userData]);

  // Calculate current day based on completed days using shared utility
  const completedDays = userData?.journeyProgress?.completedDays || [];
  const actualCurrentDay = calculateCurrentJourneyDay(userData, totalDays);
  
  // Set current week based on user's progress
  useEffect(() => {
    const userCurrentWeek = Math.ceil(actualCurrentDay / 7);
    setCurrentWeek(userCurrentWeek);
  }, [actualCurrentDay]);
  
  // Add useEffect to watch for userData changes and force re-render
  useEffect(() => {
    logger.debug('Journey progress updated', { completedDaysCount: completedDays.length, currentDay: actualCurrentDay });
    
    // Schedule notifications for incomplete days
    if (userData && actualCurrentDay <= totalDays) {
      const todaysStats = trackingManager.getTodaysStats();
      const dayCompleted = completedDays.includes(actualCurrentDay);
      
      if (!dayCompleted) {
        notificationManager.scheduleReminders(
          userData.firstName || 'user',
          actualCurrentDay,
          todaysStats.journeyActivitiesCompleted > 0
        );
      }
    }
  }, [userData?.journeyProgress?.completedDays, forceRender, actualCurrentDay]);

  // Check if it's past 12:01 AM
  const isPast1201AM = () => {
    const now = new Date();
    const threshold = new Date();
    threshold.setHours(0, 1, 0, 0); // 12:01 AM
    return now >= threshold;
  };
  
  // Check for time-sensitive reminders
  useEffect(() => {
    const checkDayReminders = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const hoursRemaining = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Check if current day is incomplete
      const completedDays = userData?.journeyProgress?.completedDays || [];
      const currentDayComplete = completedDays.includes(currentDay);
      
      if (!currentDayComplete) {
        if (Math.abs(hoursRemaining - 12) < 0.5) {
          toast({
            title: t('journey.notifications.reminderTitle'),
            description: t('journey.notifications.reminder12h'),
          });
        } else if (Math.abs(hoursRemaining - 3) < 0.5) {
          toast({
            title: t('journey.notifications.almostThere'),
            description: t('journey.notifications.almostThereMsg'),
          });
        } else if (Math.abs(hoursRemaining - 1) < 0.5) {
          toast({
            title: t('journey.notifications.finalHour'),
            description: t('journey.notifications.finalHourMsg'),
          });
        }
      }
    };

    // Check every hour
    const interval = setInterval(checkDayReminders, 60 * 60 * 1000);
    checkDayReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [currentDay, userData, toast]);

  // Get journey days dynamically from loaded data
  const getAllJourneyDays = () => {
    if (!userJourney?.days) return [];
    
    return userJourney.days.map((dayData: any) => {
      // Apply phase modifier if available
      if (phaseModifier) {
        const modifiedData = journeyManager.applyPhaseModifier(dayData, phaseModifier);
        return {
          ...modifiedData,
          duration: `${Math.floor(Math.random() * 3) + 5} ${t('common.min')}`, // 5-7 minutes
        };
      }
      
      return {
        ...dayData,
        duration: `${Math.floor(Math.random() * 3) + 5} ${t('common.min')}`, // 5-7 minutes
      };
    });
  };

  const allJourneyDays = getAllJourneyDays();

  // Organize days into weeks for display
  const getWeekDays = (weekNumber: number) => {
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = Math.min(weekNumber * 7, totalDays);
    
    return allJourneyDays.slice(startDay - 1, endDay);
  };

  // Get current week data
  const totalWeeks = Math.ceil(totalDays / 7);
  const currentWeekData = {
    weekNumber: currentWeek,
    days: getWeekDays(currentWeek),
    title: currentWeek === 1 ? t('journey.weekFoundation') : `Week ${currentWeek}`,
  };

  // Navigation handlers
  const canGoToPreviousWeek = currentWeek > 1;
  const canGoToNextWeek = currentWeek < totalWeeks && completedDays.length >= (currentWeek - 1) * 7;
  
  const handlePreviousWeek = () => {
    if (canGoToPreviousWeek) {
      setCurrentWeek(currentWeek - 1);
    }
  };
  
  const handleNextWeek = () => {
    if (canGoToNextWeek) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const handleDayClick = (day: number) => {
    // Enhanced unlocking logic using journeyManager with completion dates
    const completionDates = userData?.journeyProgress?.completionDates;
    const completionDatesMap = completionDates ? Object.fromEntries(
      Object.entries(completionDates).map(([k, v]) => [parseInt(k), new Date(v as string)])
    ) : undefined;
    
    const isUnlocked = journeyManager.isDayUnlocked(completedDays, day, new Date(), completionDatesMap);
    const isCompleted = completedDays.includes(day);
    
    if (isUnlocked || isCompleted) {
      setSelectedDay(day);
      const dayData = allJourneyDays[day - 1];
      logActivity(`Opened Day ${day}: ${dayData?.title || 'Unknown'}`);
    } else {
      let reason = "";
      const isPreviousDayCompleted = day === 1 || completedDays.includes(day - 1);
      
      if (!isPast1201AM()) {
        reason = t('journey.notifications.unlock1201');
      } else if (!isPreviousDayCompleted) {
        reason = t('journey.notifications.completeFirst', { day: day - 1 });
      }
      
      toast({
        title: t('journey.notifications.dayLocked'),
        description: reason,
      });
    }
  };

  const handleCompleteDay = (day: number) => {
    logger.debug('Recovery journey day completion', { day, completedDaysCount: completedDays.length });
    
    // Update current day if this was the active day
    if (day === actualCurrentDay && day < totalDays) {
      setCurrentDay(day + 1);
    }
    
    setSelectedDay(null);
    
    // Force re-render to update UI
    setForceRender(prev => prev + 1);
    
    if (day === 7) {
      toast({
        title: t('journey.notifications.week1Complete'),
        description: t('journey.notifications.week1CompleteMsg'),
      });
    } else {
      toast({
        title: t('journey.notifications.dayComplete', { day }),
        description: t('journey.notifications.dayCompleteMsg'),
      });
    }
  };

  const getDayStatusForDay = (day: number) => {
    return getDayStatus(userData, day);
  };

  const getButtonText = (day: number, status: string) => {
    if (status === 'completed') return t('journey.review');
    if (status === 'unlocked') return t('journey.start');
    return t('journey.locked');
  };

  const progress = (completedDays.length / totalDays) * 100;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          <span className="font-oswald font-extralight tracking-tight">YOUR</span><span className="font-fjalla font-extrabold italic">JOURNEY</span>
        </h1>
        <p className="text-muted-foreground font-oswald">{t('journey.subtitle')}</p>
      </div>

      {/* Overall Progress Card */}
      <Card className="bg-card border-0 p-6 rounded-xl mb-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-primary p-2 rounded-lg">
            <Target className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">{t('journey.overallProgress').toUpperCase()}</h3>
            <p className="text-muted-foreground text-[16px]">
              {completedDays.length} {t('common.of')} {totalDays} {t('journey.daysCompleted')}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('journey.journeyProgress')}</span>
            <span className="text-primary font-bold text-lg">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-muted">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </Progress>
        </div>
      </Card>

      {/* Week Navigation and Display */}
      {currentWeekData.days.length > 0 && (
        <Card className="bg-card p-6 rounded-xl mb-6 border-0 shadow-sm">
          {/* Week Header with Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Trophy className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                {currentWeekData.title.toUpperCase()}
              </h3>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={!canGoToPreviousWeek}
                className="px-2"
              >
                <ChevronLeft size={16} />
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                {currentWeek} / {totalWeeks}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={!canGoToNextWeek}
                className="px-2"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          
          {/* Days List */}
          <div className="space-y-3">
            {currentWeekData.days.map((dayModule: any) => {
              const status = getDayStatusForDay(dayModule.day);
              const isCompleted = status === 'completed';
              const isUnlocked = status === 'unlocked' || isCompleted;
              const buttonText = getButtonText(dayModule.day, status);
              
              return (
                <Card
                  key={dayModule.day}
                  onClick={() => isUnlocked && handleDayClick(dayModule.day)}
                  className={`p-4 transition-all duration-200 border rounded-lg ${
                    isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                  } ${
                    isCompleted
                      ? 'bg-primary/10 border-primary/20 shadow-sm'
                      : isUnlocked
                        ? 'bg-card hover:bg-accent border-border shadow-sm'
                        : 'bg-muted opacity-60 border-border'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-primary'
                        : isUnlocked
                          ? 'bg-primary'
                          : 'bg-muted'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="text-primary-foreground" size={20} />
                      ) : isUnlocked ? (
                        <Play className="text-primary-foreground" size={20} />
                      ) : (
                        <Lock className="text-muted-foreground" size={20} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-fjalla font-bold text-primary text-sm">
                          {t('common.day').toUpperCase()} {dayModule.day}
                        </span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs font-source uppercase tracking-wide">
                          {dayModule.tool || 'RECOVERY TOOL'}
                        </span>
                      </div>
                      
                      <h3 className={`font-medium text-[16px] mb-1 ${
                        isUnlocked ? 'text-card-foreground' : 'text-muted-foreground'
                      }`}>
                        {dayModule.title}
                      </h3>
                      
                      <p className={`text-sm mb-2 ${
                        isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
                      }`}>
                        {dayModule.keyMessage}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock size={12} className="text-primary" />
                        <span>{dayModule.duration}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className={`font-fjalla font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                        !isUnlocked
                          ? 'bg-muted text-muted-foreground cursor-not-allowed border border-muted'
                          : isCompleted 
                            ? 'border-primary text-primary hover:bg-primary/10 bg-transparent border'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                      }`}
                      disabled={!isUnlocked}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isUnlocked) {
                          handleDayClick(dayModule.day);
                        }
                      }}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}


      {/* Day Modal */}
      {selectedDay && allJourneyDays[selectedDay - 1] && (
        <JourneyDayModal
          day={selectedDay}
          dayData={allJourneyDays[selectedDay - 1]}
          isCompleted={completedDays.includes(selectedDay)}
          onClose={() => setSelectedDay(null)}
          onComplete={() => handleCompleteDay(selectedDay)}
          onNavigateToHome={onNavigateToHome}
        />
      )}
      </div>
    </div>
  );
};

export default RecoveryJourney;
