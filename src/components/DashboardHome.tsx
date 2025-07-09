import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame, Target, Trophy, Calendar, MessageCircle, Bot } from 'lucide-react';
import SMSOptIn from './SMSOptIn';
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
  const { userData, logActivity } = useUserData();

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

  // Calculate recovery streak based on daily activity
  const [recoveryStreak, setRecoveryStreak] = useState(23);

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
  }, [userData]);

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
      <div className="p-5 pb-24">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-fjalla tracking-wide">
                <span className="font-thin italic">DAILY</span> <span className="font-black italic">LEAP</span>
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium">9:41</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-4 bg-foreground rounded-sm opacity-60"></div>
                </div>
              </div>
            </div>
            <p className="text-foreground font-source font-medium tracking-wide mb-1 text-lg">
              WELCOME BACK, <span className="font-bold italic">{currentUser.toUpperCase()}</span>
            </p>
            <p className="text-muted-foreground text-sm">Your recovery journey continues</p>
          </div>
        </div>

        {/* Row 1 - Horizontal Split Cards (72/28) */}
        <div className="flex gap-4 mb-4">
          {/* Today's Motivation Card - 72% width */}
          <Card className="bg-card border border-border shadow-sm p-4 rounded-xl flex-[72]">
            <div className="flex items-start space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Target className="text-primary-foreground" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-fjalla font-bold text-foreground mb-2 tracking-wide text-sm uppercase">
                  TODAY'S MOTIVATION
                </h3>
                <p className="text-foreground text-base font-source italic leading-relaxed">"{dailyMotivation}"</p>
              </div>
            </div>
          </Card>

          {/* Recovery Streak Card - 28% width */}
          <Card className="bg-card border border-border shadow-sm p-4 rounded-xl flex-[28]">
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-primary p-2 rounded-lg mb-2">
                <Flame className="text-primary-foreground" size={20} />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{recoveryStreak}</div>
              <p className="text-muted-foreground text-sm font-medium">days strong</p>
            </div>
          </Card>
        </div>

        {/* Coming Up This Week */}
        <Card className="bg-card border border-border shadow-sm mb-4 p-4 rounded-xl">
          <h3 className="font-fjalla font-bold text-foreground mb-4 tracking-wide text-sm uppercase">
            COMING UP THIS WEEK
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-source font-normal">Day 20: Weekend Recovery Strategies</span>
              <span className="text-primary font-source font-bold text-sm uppercase">TOMORROW</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground font-source font-normal">Day 25: Peer Communication</span>
              <span className="text-primary font-source font-bold text-sm uppercase">2 DAYS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground font-source font-normal">Day 30: Month Milestone Review</span>
              <span className="text-primary font-source font-bold text-sm uppercase">1 WEEK</span>
            </div>
          </div>
        </Card>

        {/* The Foreman Card */}
        <Card className="bg-card border border-border shadow-sm mb-4 p-4 rounded-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border-2 border-border">
              <Bot className="text-foreground" size={24} />
            </div>
            <div>
              <h3 className="font-fjalla font-bold text-foreground text-lg tracking-wide uppercase">
                THE FOREMAN
              </h3>
              <p className="text-muted-foreground text-sm font-source italic">Your AI recovery mentor</p>
            </div>
          </div>
          <Button 
            onClick={() => onNavigate?.('foreman')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-source font-bold py-3 rounded-lg tracking-wide uppercase"
          >
            CHAT WITH THE FOREMAN
          </Button>
        </Card>

        {/* Bottom Action Cards - 50/50 Split */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-card border border-border shadow-sm p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate?.('calendar')}
          >
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="bg-primary p-3 rounded-lg">
                <Calendar className="text-primary-foreground" size={24} />
              </div>
              <h3 className="font-fjalla font-bold text-foreground text-sm tracking-wide uppercase">CALENDAR</h3>
            </div>
          </Card>
          <Card 
            className="bg-card border border-border shadow-sm p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate?.('chat')}
          >
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="bg-primary p-3 rounded-lg">
                <MessageCircle className="text-primary-foreground" size={24} />
              </div>
              <h3 className="font-fjalla font-bold text-foreground text-sm tracking-wide uppercase">CHAT SUPPORT</h3>
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