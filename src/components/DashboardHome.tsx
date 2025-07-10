import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame, Target, Trophy, Calendar, MessageCircle, Bot, ChevronRight, Play } from 'lucide-react';
import SMSOptIn from './SMSOptIn';
import { useUserData } from '@/hooks/useUserData';
import PhoneNumberPrompt from './PhoneNumberPrompt';
import StreakReminder from './StreakReminder';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const [showSMSOptIn, setShowSMSOptIn] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showStreakReminder, setShowStreakReminder] = useState(false);
  const { userData, logActivity } = useUserData();
  const { t, language } = useLanguage();

  // Daily motivation logic
  const [dailyMotivation, setDailyMotivation] = useState('');

  const dailyQuotes = [
    "Every day is a new opportunity to build the life you want.",
    "Strength doesn't come from what you can do. It comes from overcoming what you thought you couldn't.",
    "The only impossible journey is the one you never begin.",
    "Recovery is not a destination, it's a way of life.",
    "Progress, not perfection, is the goal.",
    "You are stronger than your urges.",
    "One day at a time, one choice at a time.",
    "Your past doesn't define your future.",
    "Courage isn't the absence of fear, it's moving forward despite it.",
    "Every small step forward is a victory.",
    "Recovery is a journey of self-discovery.",
    "You have the power to change your story.",
    "Healing happens one breath at a time.",
    "Your strength is greater than any challenge.",
    "Today is a new chance to choose recovery."
  ];

  // Calculate recovery streak and badges based on daily activity
  const [recoveryStreak, setRecoveryStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [currentJourneyDay, setCurrentJourneyDay] = useState(1);

  useEffect(() => {
    // Load daily motivation based on user's day count
    const currentDate = new Date();
    const todayString = currentDate.toDateString();
    const savedMotivationDate = localStorage.getItem('motivationDate');
    const savedMotivation = localStorage.getItem('dailyMotivation');
    const userStartDate = localStorage.getItem('userStartDate') || todayString;
    
    if (savedMotivationDate === todayString && savedMotivation) {
      setDailyMotivation(savedMotivation);
    } else {
    // Calculate days since user started
      const startDate = new Date(userStartDate);
      const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const motivationHeaders = t('home.motivation.headers');
      const quoteIndex = daysSinceStart % motivationHeaders.length;
      
      // Set current journey day (minimum 1, maximum 90 for the program)
      setCurrentJourneyDay(Math.min(Math.max(1, daysSinceStart + 1), 90));
      
      const newMotivation = motivationHeaders[quoteIndex];
      setDailyMotivation(newMotivation);
      localStorage.setItem('motivationDate', todayString);
      localStorage.setItem('dailyMotivation', newMotivation);
      
      if (!localStorage.getItem('userStartDate')) {
        localStorage.setItem('userStartDate', todayString);
      }
    }

    // Calculate recovery streak
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
    
    // Calculate badge count based on activities completed
    const uniqueActivities = new Set(activityLog.map(entry => entry.action));
    setBadgeCount(uniqueActivities.size);
  }, [userData, language]);  // Add language dependency to refresh translations

  const currentUser = localStorage.getItem('currentUser') || 'JOSEPH';

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
              <p className="text-muted-foreground text-sm">Your recovery journey continues.</p>
            </div>
            
            {/* Right column: Theme toggle, Language toggle, and Trophy */}
            <div className="flex flex-col items-end justify-between min-h-[120px]">
              <ThemeToggle />
              <LanguageToggle />
              <div className="flex items-center space-x-2">
                <div className="bg-primary p-2 rounded-lg">
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
              <div className="bg-primary p-2 rounded-sm">
                <Target className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                TODAY'S MOTIVATION
              </h3>
            </div>
            <p className="text-card-foreground text-sm italic leading-tight">"{dailyMotivation}"</p>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[30%]">
            <div className="text-center">
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide mb-2">
                STREAK
              </h3>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="bg-primary p-2 rounded-sm">
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
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-400 p-2 rounded-sm">
                  <Play className="text-black" size={20} />
                </div>
                <span className="text-card-foreground font-source text-sm">Day {currentJourneyDay}: Building Daily Habits</span>
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
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-source text-sm">Day 20: Weekend Recovery Strategies</span>
              <span className="text-primary font-source font-bold text-sm">TOMORROW</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-source text-sm">Day 25: Peer Communication</span>
              <span className="text-primary font-source font-bold text-sm">2 DAYS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-source text-sm">Day 30: Month Milestone Review</span>
              <span className="text-primary font-source font-bold text-sm">1 WEEK</span>
            </div>
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
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-card p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-300 border-0 shadow-none"
            onClick={() => onNavigate?.('calendar')}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary p-3 rounded-lg">
                <Calendar className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">CALENDAR</h3>
            </div>
          </Card>
          <Card 
            className="bg-card p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-300 border-0 shadow-none"
            onClick={() => onNavigate?.('chat')}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary p-3 rounded-lg">
                <MessageCircle className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">CHAT SUPPORT</h3>
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