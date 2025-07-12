import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame, Target, Trophy, Calendar, MessageCircle, Bot, ChevronRight, Play, Shield, Zap, UserCheck } from 'lucide-react';
import SMSOptIn from './SMSOptIn';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PhoneNumberPrompt from './PhoneNumberPrompt';
import StreakReminder from './StreakReminder';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';
import { calculateCurrentJourneyDay, getDayStatus } from '@/utils/journeyCalculation';
import { trackingManager } from '@/utils/trackingManager';
import { journeyManager } from '@/utils/journeyManager';

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const [showSMSOptIn, setShowSMSOptIn] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showStreakReminder, setShowStreakReminder] = useState(false);
  const [isSpecialist, setIsSpecialist] = useState(false);
  const { userData, logActivity } = useUserData();
  const { user } = useAuth();
  const { t, language, getArray } = useLanguage();

  // Daily motivation logic
  const [dailyMotivation, setDailyMotivation] = useState('');

  // Real-time tracking data
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);

  // Calculate recovery streak and badges based on daily activity
  const [recoveryStreak, setRecoveryStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  
  // Calculate current journey day using shared utility
  const currentJourneyDay = calculateCurrentJourneyDay(userData);
  
  // Check if the current day is locked
  const currentDayStatus = getDayStatus(userData, currentJourneyDay);

  useEffect(() => {
    // Check if current user is a peer specialist
    const checkSpecialistStatus = async () => {
      if (user) {
        const { data } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        
        setIsSpecialist(!!data);
      }
    };
    
    checkSpecialistStatus();
  }, [user]);

  useEffect(() => {
    // Load daily motivation based on user's day count
    const currentDate = new Date();
    const todayString = currentDate.toDateString();
    const savedMotivationDate = localStorage.getItem('motivationDate');
    const savedMotivation = localStorage.getItem('dailyMotivation');
    const savedLanguage = localStorage.getItem('motivationLanguage');
    const userStartDate = localStorage.getItem('userStartDate') || todayString;
    
    if (savedMotivationDate === todayString && savedMotivation && savedLanguage === language) {
      setDailyMotivation(savedMotivation);
    } else {
    // Calculate days since user started
      const startDate = new Date(userStartDate);
      const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const motivationHeaders = getArray('home.motivation.headers');
      logger.debug('Motivation headers loaded', { motivationHeaders, language });
      
      // Ensure we have an array of quotes
      if (Array.isArray(motivationHeaders) && motivationHeaders.length > 0) {
        const quoteIndex = daysSinceStart % motivationHeaders.length;
        const newMotivation = motivationHeaders[quoteIndex];
        logger.debug('Selected daily motivation', { newMotivation, quoteIndex });
        
        setDailyMotivation(newMotivation);
        localStorage.setItem('motivationDate', todayString);
        localStorage.setItem('dailyMotivation', newMotivation);
        localStorage.setItem('motivationLanguage', language);
      } else {
        logger.error('Motivation headers not found or empty', { motivationHeaders });
        setDailyMotivation(t('home.journeyContinues'));
      }
      
      if (!localStorage.getItem('userStartDate')) {
        localStorage.setItem('userStartDate', todayString);
      }
    }

    // Load real-time tracking data
    if (userData) {
      try {
        const stats = trackingManager.getTodaysStats();
        const streak = trackingManager.getStreakData();
        setDailyStats(stats);
        setStreakData(streak);
        setRecoveryStreak(streak.currentStreak);
      } catch (error) {
        console.error('Failed to load tracking stats:', error);
        // Fallback to legacy calculation
        const activityLog = userData?.activityLog || [];
        let currentStreak = 0;
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(currentDate.getDate() - i);
          const dateString = checkDate.toDateString();
          
          const hasActivity = activityLog.some(entry => 
            new Date(entry.timestamp).toDateString() === dateString
          );
          
          if (hasActivity) {
            currentStreak++;
          } else if (i === 0) {
            continue;
          } else {
            break;
          }
        }
        
        setRecoveryStreak(currentStreak);
      }
    }
    
    // Calculate badge count based on activities completed
    const uniqueActivities = new Set((userData?.activityLog || []).map(entry => entry.action));
    setBadgeCount(uniqueActivities.size);
  }, [userData, language]);  // Add language dependency to refresh translations

  // Get upcoming week activities - random 3 days from next 7 in chronological order
  const getUpcomingWeekActivities = () => {
    console.log('=== DEBUG: getUpcomingWeekActivities ===');
    console.log('userData:', userData);
    console.log('userData.focusAreas:', userData?.focusAreas);
    
    // If no focus areas, default to "Craving Control" for demo purposes
    const focusAreas = userData?.focusAreas?.length ? userData.focusAreas : ["Craving Control"];
    console.log('using focusAreas:', focusAreas);

    const journey = journeyManager.getUserJourney(focusAreas);
    console.log('journey found:', journey ? `Journey with ${journey.days.length} days` : 'null');
    
    if (!journey) {
      console.log('No journey found for focus areas:', focusAreas);
      return [];
    }

    const completedDays = userData?.journeyProgress?.completedDays || [];
    const today = calculateCurrentJourneyDay(userData);
    const startDay = today + 1; // Start from tomorrow
    
    console.log('today:', today, 'startDay:', startDay, 'completedDays:', completedDays);
    
    const upcomingActivities = [];
    const maxDay = Math.min(startDay + 6, journey.days.length); // Next 7 days from tomorrow
    
    console.log('Looking for activities from day', startDay, 'to', maxDay);
    
    for (let day = startDay; day <= maxDay; day++) {
      const dayData = journey.days.find(d => d.day === day);
      console.log(`Day ${day}:`, dayData ? {
        activity: dayData.activity,
        tool: dayData.tool,
        hasActivity: !!dayData.activity,
        hasTool: !!dayData.tool
      } : 'not found');
      
      if (dayData) { // Remove unlock check - show all upcoming activities
        const daysUntil = day - today; // Calculate relative to today
        const timeLabel = daysUntil === 1 ? 'Tomorrow' : 
                         `${daysUntil} days`;
        
        // Prioritize activity over tool, only one item per day
        if (dayData.activity) {
          upcomingActivities.push({
            title: dayData.activity,
            timeLabel,
            day,
            type: 'activity'
          });
        } else if (dayData.tool) {
          upcomingActivities.push({
            title: dayData.tool,
            timeLabel,
            day,
            type: 'tool'
          });
        }
      }
    }
    
    console.log('upcomingActivities before selection:', upcomingActivities);
    
    // Shuffle the array and take 3 random items, then sort by day to maintain chronological order
    const shuffled = [...upcomingActivities].sort(() => Math.random() - 0.5);
    const randomSelection = shuffled.slice(0, 3);
    const result = randomSelection.sort((a, b) => a.day - b.day); // Sort chronologically
    
    console.log('final result:', result);
    return result;
  };

  console.log('=== DASHBOARD DEBUG ===');
  console.log('userData:', userData);
  console.log('userData.focusAreas:', userData?.focusAreas);
  console.log('About to call getUpcomingWeekActivities...');
  
  const upcomingActivities = getUpcomingWeekActivities();
  console.log('upcomingActivities result:', upcomingActivities);
  
  const currentUser = userData?.firstName || localStorage.getItem('currentUser') || t('home.defaultWelcome');

  const handleToolClick = (tool: string) => {
    logActivity('Used ' + tool);
    onNavigate?.(tool);
  };

  const handlePhoneNumberSaved = () => {
    setShowPhonePrompt(false);
    handleToolClick('chat');
  };

  const handleStreakReminderAction = () => {
    setShowStreakReminder(false);
    localStorage.setItem('streakReminderShown', new Date().toDateString());
    logActivity('Streak reminder check-in');
  };

  const handleStreakReminderClose = () => {
    setShowStreakReminder(false);
    localStorage.setItem('streakReminderShown', new Date().toDateString());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-6">
            {/* Left column: Title and welcome text */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">DAILY</span><span className="font-fjalla font-extrabold italic">LEAP</span>
              </h1>
              <div className="mt-8"></div>
              <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
                {t('home.welcome').toUpperCase()}, <span className="font-bold italic">{currentUser.toUpperCase()}</span>
              </p>
              <p className="text-muted-foreground text-sm">{t('home.journeyContinues')}</p>
            </div>
            
            {/* Right column: Theme toggle, Language toggle, and Trophy */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <LanguageToggle />
              </div>
              <div className="flex items-end space-x-2 mt-12">
                <div className="bg-primary p-3 rounded-lg">
                  <Trophy className="text-primary-foreground" size={20} />
                </div>
                <span className="text-3xl font-bold text-foreground">{badgeCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Motivation and Streak Cards */}
        <div className="flex gap-4 mb-4">
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[70%]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-primary p-3 rounded-sm">
                <Target className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                {t('home.todaysMotivation').toUpperCase()}
              </h3>
            </div>
            <p className="text-card-foreground text-sm italic leading-tight">"{dailyMotivation}"</p>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[30%]">
            <div className="text-center">
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide mb-2">
                {t('home.streak.title').toUpperCase()}
              </h3>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="bg-primary p-3 rounded-sm">
                  <Flame className="text-primary-foreground" size={20} />
                </div>
                <div className="text-[28px] font-bold text-card-foreground">{recoveryStreak}</div>
              </div>
              <p className="text-muted-foreground text-xs lowercase italic">{t('home.streak.days').toLowerCase()}</p>
            </div>
          </Card>
        </div>

        {/* Start Your Day Card */}
        <Card className="bg-black/[7.5%] p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground mb-2 tracking-wide">
            {t('home.startDay').toUpperCase()}
          </h3>
          <div className="cursor-pointer" onClick={() => onNavigate?.('journey')}>
            <div className={`flex items-center ${currentDayStatus === 'locked' ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-400 p-3 rounded-sm">
                  <Play className="text-black" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-card-foreground font-source text-sm">
                    {t('home.currentDay', {day: currentJourneyDay})}
                  </span>
                  {currentDayStatus === 'locked' && (
                    <span className="text-muted-foreground font-source text-xs">
                      Available Tomorrow
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Coming Up This Week */}
        <Card className="bg-card p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">
            {t('home.comingUp').toUpperCase()}
          </h3>
          <div className="space-y-3">
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity, index) => (
                <div key={index} className="flex items-start justify-between gap-3">
                  <span className="text-card-foreground font-source text-sm flex-1">{activity.title}</span>
                  <span className="text-primary font-source font-bold text-sm whitespace-nowrap">{activity.timeLabel.toUpperCase()}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-2">
                <span className="text-muted-foreground font-source text-sm italic">
                  Complete your current day to see upcoming activities
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* The Foreman Card */}
        <Card className="relative bg-card rounded-lg mb-4 border-0 shadow-none transition-colors duration-300 overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/lovable-uploads/c61510da-8bef-4d57-8fba-f87d453bd59e.png)'
            }}
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Content */}
          <div className="relative z-10 p-4">
            <div className="flex flex-col items-center text-center mb-4">
              <div>
                <h3 className="font-fjalla font-bold text-white text-2xl tracking-wide">
                  {t('home.foreman.title').toUpperCase()}
                </h3>
                <p className="text-white/80 text-sm font-source">{t('home.foreman.subtitle')}</p>
              </div>
            </div>
            <Button 
              onClick={() => onNavigate?.('foreman')}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-source font-bold py-3 rounded-lg tracking-wide transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <Bot size={20} />
              {t('home.foreman.button').toUpperCase()}
            </Button>
          </div>
        </Card>


        {/* Bottom Action Cards */}
        <div className="flex justify-center">
          <Card 
            className="bg-card p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-300 border-0 shadow-none w-48"
            onClick={() => onNavigate?.('calendar')}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary p-3 rounded-lg">
                <Calendar className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">{t('nav.calendar').toUpperCase()}</h3>
            </div>
          </Card>
        </div>
      </div>

      {/* SMS Opt-in Modal */}
      {showSMSOptIn && (
        <SMSOptIn onClose={() => setShowSMSOptIn(false)} />
      )}

      {/* Phone Number Prompt */}
      {showPhonePrompt && (
        <PhoneNumberPrompt
          onClose={() => setShowPhonePrompt(false)}
          onSave={handlePhoneNumberSaved}
        />
      )}

      {/* Streak Reminder */}
      {showStreakReminder && (
        <StreakReminder
          onClose={handleStreakReminderClose}
          onAction={handleStreakReminderAction}
        />
      )}
    </div>
  );
};

export default DashboardHome;