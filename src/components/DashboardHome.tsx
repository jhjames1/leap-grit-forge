import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, Info, Smartphone, Trophy, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import SMSOptIn from './SMSOptIn';
import RecoveryStrengthMeter from './RecoveryStrengthMeter';
import { useRecoveryStrength } from '@/hooks/useRecoveryStrength';
import { useUserData } from '@/hooks/useUserData';
import PhoneNumberPrompt from './PhoneNumberPrompt';
import StreakReminder from './StreakReminder';

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const [showSMSOptIn, setShowSMSOptIn] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showStreakReminder, setShowStreakReminder] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const { strengthData, logAction } = useRecoveryStrength();
  const { userData, updateUserData, logActivity } = useUserData();

  // Check if user has phone number
  const hasPhoneNumber = Boolean(localStorage.getItem('phoneNumber'));

  // Daily motivation logic - no repeats, no resets
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

  // Calculate recovery streak based on daily activity
  const [recoveryStreak, setRecoveryStreak] = useState(0);
  const [nextMilestone] = useState(30);
  const [yesterdayStrength, setYesterdayStrength] = useState(0);

  // Get yesterday's strength
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `strength_${yesterday.toDateString()}`;
    const savedYesterdayStrength = localStorage.getItem(yesterdayKey);
    if (savedYesterdayStrength) {
      setYesterdayStrength(parseInt(savedYesterdayStrength));
    }
  }, []);

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
      const quoteIndex = daysSinceStart % dailyQuotes.length;
      
      const newMotivation = dailyQuotes[quoteIndex];
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
    
    for (let i = 0; i < 365; i++) { // Check up to 365 days back
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasActivity = activityLog.some(entry => 
        new Date(entry.timestamp).toDateString() === dateString
      );
      
      if (hasActivity) {
        currentStreak++;
      } else if (i === 0) {
        // Today has no activity, but don't break streak yet
        continue;
      } else {
        break;
      }
    }
    
    setRecoveryStreak(currentStreak);

    // Check for streak reminder (3 hours before midnight)
    const checkStreakReminder = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      const hasActivityToday = activityLog.some(entry => 
        new Date(entry.timestamp).toDateString() === currentDate.toDateString()
      );
      
      const reminderShownToday = localStorage.getItem('streakReminderShown') === currentDate.toDateString();
      
      if (hoursUntilMidnight <= 3 && !hasActivityToday && !reminderShownToday) {
        setShowStreakReminder(true);
      }
    };

    checkStreakReminder();
    
    // Check if user has already seen SMS opt-in
    const hasSeenSMSOptIn = localStorage.getItem('smsOptIn');
    if (!hasSeenSMSOptIn) {
      const timer = setTimeout(() => {
        setShowSMSOptIn(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userData]);

  const progressPercentage = (recoveryStreak / nextMilestone) * 100;

  const handleToolClick = (tool: string) => {
    logAction('tool_used');
    logActivity('Used ' + tool);
    onNavigate?.(tool);
  };

  const handlePeerChatClick = () => {
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      setShowPhonePrompt(true);
    } else {
      handleToolClick('chat');
    }
  };

  const handlePhoneNumberSaved = () => {
    setShowPhonePrompt(false);
    handleToolClick('chat');
  };

  const handleStreakReminderAction = () => {
    setShowStreakReminder(false);
    localStorage.setItem('streakReminderShown', new Date().toDateString());
    // User took action, log activity
    logActivity('Streak reminder check-in');
  };

  const handleStreakReminderClose = () => {
    setShowStreakReminder(false);
    localStorage.setItem('streakReminderShown', new Date().toDateString());
  };

  // Calculate today's Journey activities completion
  const getTodayJourneyCompletion = () => {
    const today = new Date().toDateString();
    const completedDays = userData?.journeyProgress?.completedDays || [];
    const todayCompleted = completedDays.some(day => {
      // Check if any Journey day was completed today
      const journeyActivity = userData?.activityLog?.find(entry => 
        entry.action.includes('Completed Day') && 
        new Date(entry.timestamp).toDateString() === today
      );
      return journeyActivity !== undefined;
    });
    
    return todayCompleted ? 1 : 0;
  };

  // Convert RecoveryStrengthData to RecoveryData format with updated logic
  const convertToRecoveryData = () => {
    const todayJourneyActions = getTodayJourneyCompletion();
    const currentStrength = todayJourneyActions > 0 ? 100 : 0;
    const wellnessLevel = todayJourneyActions > 0 ? "Good" : "Building";
    
    const recentChanges = strengthData.recentChanges || [];
    const hasPositiveChange = recentChanges.some(change => change.change > 0);
    const hasNegativeChange = recentChanges.some(change => change.change < 0);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (hasPositiveChange && !hasNegativeChange) {
      trend = 'up';
    } else if (hasNegativeChange && !hasPositiveChange) {
      trend = 'down';
    }

    return {
      currentStrength,
      dailyActions: todayJourneyActions,
      weeklyGoal: 7,
      trend,
      yesterdayStrength,
      wellnessLevel
    };
  };

  // Generate calendar data for current month
  const generateCalendarData = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toDateString();
      const hasJourneyActivity = userData?.activityLog?.some(entry => 
        entry.action.includes('Completed Day') && 
        new Date(entry.timestamp).toDateString() === dateString
      );
      
      calendarDays.push({
        day,
        hasActivity: hasJourneyActivity,
        date: dateString,
        isToday: dateString === new Date().toDateString()
      });
    }
    
    return calendarDays;
  };

  const calendarData = generateCalendarData();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const navigateCalendar = (direction: 'prev' | 'next') => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="relative min-h-screen">
      {/* Updated Background - Journey Page Style */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-steel-dark to-midnight"></div>
      
      {/* Content */}
      <div className="relative z-10 p-4 pb-24">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="font-anton text-3xl text-white mb-2 text-shadow">Daily LEAP</h1>
            <p className="text-steel-light font-oswald">Your recovery journey continues</p>
          </div>
          <div className="flex space-x-2">
            {/* Mobile/SMS icon only shows if no phone number */}
            {!hasPhoneNumber && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSMSOptIn(true)}
                className="text-steel-light hover:text-construction hover:bg-construction/10"
              >
                <Smartphone size={20} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate?.('about')}
              className="text-steel-light hover:text-construction hover:bg-construction/10"
            >
              <Info size={20} />
            </Button>
          </div>
        </div>

        {/* Recovery Strength Meter - With yellow border */}
        <div className="mb-6">
          <RecoveryStrengthMeter data={convertToRecoveryData()} />
        </div>

        {/* Daily Quote Card - With yellow border */}
        <Card className="bg-[#1A2642]/75 backdrop-blur-sm border-[#F9D058] border-[1px] mb-6 p-6 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-construction p-2 rounded-lg">
              <Target className="text-midnight" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-oswald font-semibold text-white mb-2">Today's Motivation</h3>
              <p className="text-steel-light italic leading-relaxed">"{dailyMotivation}"</p>
            </div>
          </div>
        </Card>

        {/* Progress Streak with Real-time Calendar - With yellow border */}
        <Card className="bg-[#1A2642]/75 backdrop-blur-sm border-[#F9D058] border-[1px] mb-6 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-construction to-construction-light p-2 rounded-lg">
                <Flame className="text-midnight" size={20} />
              </div>
              <div>
                <h3 className="font-oswald font-semibold text-white">Recovery Streak</h3>
                <p className="text-steel-light text-sm">
                  <span className="text-construction font-bold text-lg">{recoveryStreak}</span> days strong
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-anton text-construction">{recoveryStreak}</div>
              <div className="text-xs text-steel-light font-oswald">DAYS</div>
            </div>
          </div>
          
          {/* Real-time Calendar Integration */}
          <div className="mb-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateCalendar('prev')}
                className="text-steel-light hover:text-construction"
              >
                <ChevronLeft size={20} />
              </Button>
              <h4 className="font-oswald font-semibold text-white">
                {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateCalendar('next')}
                className="text-steel-light hover:text-construction"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-xs text-steel-light font-oswald p-1">
                  {day}
                </div>
              ))}
              {calendarData.map((dayData, index) => (
                <div key={index} className="flex items-center justify-center p-1 relative">
                  {dayData ? (
                    <>
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs ${
                        dayData.isToday ? 'bg-construction text-midnight font-bold' : 'text-white'
                      }`}>
                        {dayData.day}
                      </div>
                      <div className="absolute -bottom-1">
                        {dayData.hasActivity ? (
                          <Flame size={10} className="text-construction" />
                        ) : dayData.day < new Date().getDate() && 
                          currentCalendarDate.getMonth() === new Date().getMonth() &&
                          currentCalendarDate.getFullYear() === new Date().getFullYear() ? (
                          <X size={8} className="text-red-500" />
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              ))}
            </div>
            
            <Button 
              onClick={() => onNavigate?.('journey')}
              className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold py-3 rounded-lg"
            >
              Take the next LEAP today
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-steel-light">Next milestone</span>
              <span className="text-construction font-oswald font-medium">{nextMilestone} days</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-steel-dark">
              <div 
                className="h-full bg-gradient-to-r from-[#F9D058] to-[#FBE89D] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </Progress>
          </div>
        </Card>

        {/* Recent Achievements - With yellow border */}
        <Card className="bg-[#1A2642]/75 backdrop-blur-sm border-[#F9D058] border-[1px] p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-construction p-2 rounded-lg">
              <Trophy className="text-midnight" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white">Recent Achievements</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-construction/10 rounded-lg border border-construction/20">
              <div className="w-8 h-8 bg-construction rounded-full flex items-center justify-center">
                <Flame size={16} className="text-midnight" />
              </div>
              <div>
                <p className="text-white font-medium">
                  <span className="text-construction font-bold">{Math.floor(recoveryStreak / 7)}</span>-Week Milestone
                </p>
                <p className="text-steel-light text-sm">Keep building momentum</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-steel/10 rounded-lg border border-steel/20">
              <div className="w-8 h-8 bg-steel rounded-full flex items-center justify-center">
                <Target size={16} className="text-construction" />
              </div>
              <div>
                <p className="text-white font-medium">{getTodayJourneyCompletion()} Journey Activities Today</p>
                <p className="text-steel-light text-sm">Stay engaged with your recovery</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showSMSOptIn && (
        <SMSOptIn onClose={() => setShowSMSOptIn(false)} />
      )}

      {showPhonePrompt && (
        <PhoneNumberPrompt 
          onClose={() => setShowPhonePrompt(false)}
          onSave={handlePhoneNumberSaved}
        />
      )}

      {showStreakReminder && (
        <StreakReminder 
          onAction={handleStreakReminderAction}
          onClose={handleStreakReminderClose}
        />
      )}
    </div>
  );
};

export default DashboardHome;
