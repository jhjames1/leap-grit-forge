import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, Info, Smartphone, Trophy } from 'lucide-react';
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
  const { strengthData, logAction } = useRecoveryStrength();
  const { userData, updateUserData, logActivity } = useUserData();

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

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/c61510da-8bef-4d57-8fba-f87d453bd59e.png')`,
          filter: 'brightness(0.5)'
        }}
      />
      
      {/* Darker Background Overlay */}
      <div className="absolute inset-0 bg-midnight/85"></div>
      
      {/* Content */}
      <div className="relative z-10 p-4 pb-24">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="font-anton text-3xl text-white mb-2">Daily LEAP</h1>
            <p className="text-steel-light font-oswald">Your recovery journey continues</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSMSOptIn(true)}
              className="text-steel-light hover:text-construction hover:bg-construction/10"
            >
              <Smartphone size={20} />
            </Button>
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

        {/* Recovery Strength Meter */}
        <RecoveryStrengthMeter data={strengthData} />

        {/* Daily Quote Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6 mt-6">
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

        {/* Progress Streak */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
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
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-steel-light">Next milestone</span>
              <span className="text-construction font-oswald font-medium">{nextMilestone} days</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-steel-dark">
              <div 
                className="h-full bg-gradient-to-r from-construction to-construction-light rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </Progress>
          </div>
        </Card>

        {/* Recent Achievements */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
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
                <p className="text-white font-medium">{userData?.toolboxStats?.toolsToday || 0} Tools Used Today</p>
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
