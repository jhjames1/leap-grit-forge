import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Play, Clock, Target, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import JourneyDayModal from './JourneyDayModal';
import JourneyHistoryTimeline from './JourneyHistoryTimeline';
import Week1DataCollection from './Week1DataCollection';
import { TestingModeControls } from './TestingModeControls';
import { useAIJourney } from '@/hooks/useAIJourney';
import { logger } from '@/utils/logger';
import { calculateCurrentJourneyDay, getDayStatus } from '@/utils/journeyCalculation';
import { journeyManager } from '@/utils/journeyManager';
import { trackingManager } from '@/utils/trackingManager';
import { notificationManager } from '@/utils/notificationManager';
import { testingMode } from '@/utils/testingMode';
import { SecureStorage } from '@/utils/secureStorage';

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
  const [showWeek1Collection, setShowWeek1Collection] = useState(false);
  const [week1CollectionDay, setWeek1CollectionDay] = useState<number | null>(null);
  const { userData, logActivity, currentUser, updateUserData, setUserData, refreshUserData, markDayComplete } = useUserData();
  const { toast } = useToast();
  const { t } = useLanguage();
  const totalDays = 90;
  
  // AI Journey hooks
  const { 
    assignment, 
    isAssignmentLoading, 
    assignJourney, 
    getJourneyDay, 
    week1Data, 
    hasAIJourney, 
    isWeek1Complete, 
    recoveryPlan,
    refresh
  } = useAIJourney();
  
  // Initialize user's journey based on their onboarding data
  useEffect(() => {
    logger.debug('Journey initialization check', { 
      userData: !!userData,
      focusAreas: userData?.focusAreas,
      journeyStage: userData?.journeyStage,
      hasUserData: !!userData,
      hasAIJourney,
      isAssignmentLoading,
      currentUser
    });

    // Wait for userData to be loaded
    if (!userData && currentUser) {
      logger.debug('Waiting for userData to load...');
      return;
    }

    // Use AI journey if available, otherwise fall back to static journey
    if (hasAIJourney && assignment) {
      logger.debug('Using AI journey', { 
        assignmentId: assignment.id,
        journeyId: assignment.journey_id 
      });
      // AI journey data will be loaded dynamically via getJourneyDay
    } else if (userData?.focusAreas && userData?.journeyStage) {
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
    } else {
      // Always load default journey if user data is missing or incomplete
      logger.debug('Loading default journey - userData missing or incomplete');
      const defaultJourney = journeyManager.getUserJourney(['stress_management']);
      const defaultModifier = journeyManager.getPhaseModifier('foundation');
      
      setUserJourney(defaultJourney);
      setPhaseModifier(defaultModifier);
      
      logger.debug('Default journey loaded', { 
        journeyFound: !!defaultJourney,
        modifierFound: !!defaultModifier,
        daysCount: defaultJourney?.days?.length || 0
      });
    }
  }, [userData?.focusAreas, userData?.journeyStage, userData, hasAIJourney, assignment, isAssignmentLoading, currentUser]);

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
    logger.debug('Journey progress updated', { 
      completedDaysCount: completedDays.length, 
      currentDay: actualCurrentDay,
      userDataLastAccess: userData?.lastAccess,
      completedDays: completedDays,
      hasUserData: !!userData
    });
    
    // Force re-render when userData changes to ensure UI is in sync
    setForceRender(prev => prev + 1);
    
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
  }, [userData?.journeyProgress?.completedDays, userData?.lastAccess, actualCurrentDay, userData]);

  // Additional effect to ensure component refreshes when returning from navigation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userData && currentUser) {
        logger.debug('Page became visible, refreshing user data');
        // Force refresh user data to ensure we have the latest state
        refreshUserData();
        setForceRender(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userData, currentUser, refreshUserData]);

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
    if (hasAIJourney && assignment) {
      // For AI journey, we'll load days dynamically
      // For now, return a placeholder structure for the UI
      return Array.from({ length: totalDays }, (_, index) => ({
        day: index + 1,
        title: `Day ${index + 1}`,
        keyMessage: 'Loading...',
        activity: 'Loading...',
        tool: 'Loading...',
        duration: '5 min',
        isAI: true
      }));
    }
    
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

  // Get the next 3 days from current progress
  const getNext3Days = () => {
    const startDay = actualCurrentDay;
    const endDay = Math.min(startDay + 3, totalDays + 1); // Show current day + next 3 days
    
    return allJourneyDays.slice(startDay - 1, endDay - 1);
  };

  // Get next 3 days data
  const next3Days = getNext3Days();
  const currentWeekData = {
    weekNumber: currentWeek,
    days: next3Days,
    title: t('journey.upcomingDays') || 'Next 3 Days',
  };

  // Function to get week titles
  function getWeekTitle(weekNum: number): string {
    const weekName = (() => {
      switch (weekNum) {
        case 1: return t('journey.weekFoundation') || 'Foundation Week';
        case 2: return 'Building Strength';
        case 3: return 'Developing Resilience';
        case 4: return 'Creating Habits';
        case 5: return 'Milestone Month';
        case 6: return 'Deeper Understanding';
        case 7: return 'Social Connections';
        case 8: return 'Mindful Living';
        case 9: return 'Advanced Strategies';
        case 10: return 'Integration';
        case 11: return 'Mastery';
        case 12: return 'Leadership';
        case 13: return 'Transformation Complete';
        default: return `Week ${weekNum}`;
      }
    })();
    
    return `Week ${weekNum}: ${weekName}`;
  }


  const handleDayClick = async (day: number) => {
    // Enhanced unlocking logic using journeyManager with completion dates
    const completionDates = userData?.journeyProgress?.completionDates;
    const completionDatesMap = completionDates ? Object.fromEntries(
      Object.entries(completionDates).map(([k, v]) => [parseInt(k), new Date(v as string)])
    ) : undefined;
    
    const isUnlocked = journeyManager.isDayUnlocked(
      completedDays, 
      day, 
      new Date(), 
      completionDatesMap,
      testingMode.shouldBypassTimeRestrictions()
    );
    const isCompleted = completedDays.includes(day);
    
    if (isUnlocked || isCompleted) {
      // Check if this is a Week 1 day (2-7) that needs data collection (unless testing mode skips it)
      if (day >= 2 && day <= 7 && !isCompleted && !testingMode.shouldSkipWeek1Requirements()) {
        setWeek1CollectionDay(day);
        setShowWeek1Collection(true);
        return;
      }
      
      // For AI journey, load day data dynamically
      if (hasAIJourney && assignment) {
        const aiDayData = await getJourneyDay(day);
        if (aiDayData) {
          setSelectedDay(day);
          logActivity(`Opened AI Day ${day}: ${aiDayData.title}`);
        } else {
          toast({
            title: "Error",
            description: "Failed to load day content. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setSelectedDay(day);
        const dayData = allJourneyDays[day - 1];
        logActivity(`Opened Day ${day}: ${dayData?.title || 'Unknown'}`);
      }
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

  const handleCompleteDay = async (day: number) => {
    logger.debug('Recovery journey day completion handler', { 
      day, 
      completedDaysCount: completedDays.length,
      actualCurrentDay,
      totalDays
    });
    
    // Close the modal
    setSelectedDay(null);
    
    // Actually mark the day as complete (saves to local storage and Supabase)
    await markDayComplete(day);
    
    // Force immediate refresh of user data from storage
    refreshUserData();
    
    // Force multiple re-renders to ensure state sync
    setForceRender(prev => prev + 1);
    setTimeout(() => setForceRender(prev => prev + 1), 100);
    setTimeout(() => setForceRender(prev => prev + 1), 300);
    
    // Update current day if this was the active day
    if (day === actualCurrentDay && day < totalDays) {
      setCurrentDay(day + 1);
    }
    
    // Show completion messages
    if (day === 7) {
      toast({
        title: t('journey.notifications.week1Complete'),
        description: t('journey.notifications.week1CompleteMsg'),
      });
      
      // Check if we have an AI journey and Week 1 is complete
      if (hasAIJourney && isWeek1Complete) {
        // Auto-generate recovery plan if not already generated
        if (!recoveryPlan) {
          toast({
            title: "Generating Recovery Plan...",
            description: "Creating your personalized recovery plan from Week 1 data.",
          });
          // The plan will be generated in the background
        } else {
          toast({
            title: "Recovery Plan Ready!",
            description: "Your personalized recovery plan is now available in the Toolbox.",
          });
        }
      }
    }
    
    logger.debug('Journey day completion handler completed');
  };

  const handleWeek1DataComplete = (day: number, data: any) => {
    setShowWeek1Collection(false);
    setWeek1CollectionDay(null);
    
    // Mark the day as completed
    handleCompleteDay(day);
    
    toast({
      title: "Foundation Data Saved",
      description: `Your Day ${day} foundation data has been added to your recovery profile.`,
    });
  };

  const handleWeek1DataSkip = () => {
    if (week1CollectionDay) {
      setShowWeek1Collection(false);
      handleCompleteDay(week1CollectionDay);
      setWeek1CollectionDay(null);
    }
  };

  const getDayStatusForDay = (day: number) => {
    // Always use the most current userData for status calculation
    const currentUserData = userData || null;
    const status = getDayStatus(currentUserData, day);
    
    logger.debug('Day status calculated', { 
      day, 
      status, 
      completedDays: currentUserData?.journeyProgress?.completedDays || [],
      hasUserData: !!currentUserData
    });
    
    return status;
  };

  const getButtonText = (day: number, status: string) => {
    if (status === 'completed') return t('journey.review');
    if (status === 'unlocked') return t('journey.start');
    return t('journey.locked');
  };

  // Testing mode handlers that work with actual user data
  const handleResetProgress = () => {
    // This will be handled by TestingModeControls
    toast({
      title: "Progress Reset",
      description: "Journey progress has been reset for testing.",
    });
    
    // Force refresh after reset
    setTimeout(() => {
      refreshUserData();
      setForceRender(prev => prev + 1);
    }, 100);
  };

  const handleTestingCompleteDay = (day: number) => {
    handleCompleteDay(day);
  };

  const handleSkipToDay = (day: number) => {
    // This will be handled by TestingModeControls
    toast({
      title: "Skipped to Day " + day,
      description: `Progress updated to day ${day} for testing.`,
    });
    
    // Force refresh after skip
    setTimeout(() => {
      refreshUserData();
      setForceRender(prev => prev + 1);
    }, 100);
  };

  const progress = (completedDays.length / totalDays) * 100;

  return (
    <div className="min-h-screen bg-[#F5F5F5] overflow-y-auto">
      <div className="p-4 pb-32">
        {/* Testing Mode Controls - Only show in development */}
        {import.meta.env.DEV && (
          <TestingModeControls
            onResetProgress={handleResetProgress}
            onCompleteDay={handleTestingCompleteDay}
            onSkipToDay={handleSkipToDay}
            currentDay={actualCurrentDay}
            maxDays={90}
          />
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">YOUR</span><span className="font-fjalla font-extrabold italic">JOURNEY</span>
          </h1>
          <p className="text-muted-foreground font-oswald">{t('journey.subtitle')}</p>
        </div>

        <Tabs defaultValue="progress" className="mb-6">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="progress" className="flex-1 font-fjalla uppercase tracking-wide">Progress</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 font-fjalla uppercase tracking-wide">History</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
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

            {/* Next 3 Days Display */}
            {currentWeekData.days.length > 0 && (
              <Card className="bg-card p-6 rounded-xl mb-6 border-0 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-2 rounded-lg">
                      <Trophy className="text-primary-foreground" size={20} />
                    </div>
                    <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                      {currentWeekData.title.toUpperCase()}
                    </h3>
                  </div>
                </div>
                
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
          </TabsContent>

          <TabsContent value="history">
            <JourneyHistoryTimeline userData={userData} />
          </TabsContent>
        </Tabs>

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

      {/* Week 1 Data Collection Modal */}
      {showWeek1Collection && week1CollectionDay && (
        <Week1DataCollection
          day={week1CollectionDay}
          onComplete={(data) => handleWeek1DataComplete(week1CollectionDay, data)}
          onSkip={handleWeek1DataSkip}
        />
      )}
      </div>
    </div>
  );
};

export default RecoveryJourney;
