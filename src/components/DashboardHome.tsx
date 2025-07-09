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
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-fjalla font-bold text-foreground mb-1 tracking-wide">
              <span className="font-thin italic">DAILY</span> <span className="font-black">LEAP</span>
            </h1>
            <p className="text-foreground font-source font-medium tracking-wide mb-1">
              WELCOME BACK, <span className="font-bold">{currentUser.toUpperCase()}</span>
            </p>
            <p className="text-muted-foreground text-sm">Your recovery journey continues</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-lg">
              <Trophy className="text-primary-foreground" size={20} />
            </div>
            <span className="text-3xl font-bold text-foreground">8</span>
          </div>
        </div>

        {/* Motivation and Recovery Streak Cards - 70/30 Split */}
        <div className="grid grid-cols-[70fr_30fr] gap-[10px] mb-4">
          {/* Today's Motivation Card */}
          <Card className="bg-white p-4 rounded-lg border-0 shadow-none">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-400 p-2 rounded-sm">
                <Target className="text-black" size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-fjalla font-bold text-black mb-2 text-sm uppercase tracking-wide">
                  TODAY'S MOTIVATION
                </h3>
                <p className="text-black text-sm italic leading-relaxed">"{dailyMotivation}"</p>
              </div>
            </div>
          </Card>

          {/* Recovery Streak Card */}
          <Card className="bg-white p-4 rounded-lg border-0 shadow-none">
            <h3 className="font-fjalla font-bold text-black text-xs uppercase tracking-wide mb-2">
              RECOVERY STREAK
            </h3>
            <div className="flex items-center space-x-2 mb-1">
              <div className="bg-yellow-400 p-2 rounded-sm">
                <Flame className="text-black" size={16} />
              </div>
              <div className="text-[28px] font-bold text-black">{recoveryStreak}</div>
            </div>
            <p className="text-gray-500 text-xs lowercase">days strong</p>
          </Card>
        </div>

        {/* Coming Up This Week */}
        <Card className="bg-white p-4 rounded-lg mb-4 border-0 shadow-none">
          <h3 className="font-fjalla font-bold text-foreground mb-4 tracking-wide">
            COMING UP THIS WEEK
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-source">Day 20: Weekend Recovery Strategies</span>
              <span className="text-primary font-source font-bold text-sm">TOMORROW</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground font-source">Day 25: Peer Communication</span>
              <span className="text-primary font-source font-bold text-sm">2 DAYS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground font-source">Day 30: Month Milestone Review</span>
              <span className="text-primary font-source font-bold text-sm">1 WEEK</span>
            </div>
          </div>
        </Card>

        {/* The Foreman Card */}
        <Card className="bg-white p-4 rounded-lg mb-4 border-0 shadow-none">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
              <Bot className="text-gray-800" size={24} />
            </div>
            <div>
              <h3 className="font-fjalla font-bold text-foreground text-lg tracking-wide">
                THE FOREMAN
              </h3>
              <p className="text-muted-foreground text-sm font-source">Your AI recovery mentor</p>
            </div>
          </div>
          <Button 
            onClick={() => onNavigate?.('foreman')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-source font-bold py-3 rounded-lg tracking-wide"
          >
            CHAT WITH THE FOREMAN
          </Button>
        </Card>

        {/* Bottom Action Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none"
            onClick={() => onNavigate?.('calendar')}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary p-3 rounded-lg">
                <Calendar className="text-primary-foreground" size={24} />
              </div>
               <h3 className="font-fjalla font-bold text-foreground text-sm tracking-wide">CALENDAR</h3>
             </div>
           </Card>
           <Card 
             className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none"
             onClick={() => onNavigate?.('chat')}
           >
             <div className="flex flex-col items-center space-y-2">
               <div className="bg-primary p-3 rounded-lg">
                 <MessageCircle className="text-primary-foreground" size={24} />
               </div>
               <h3 className="font-fjalla font-bold text-foreground text-sm tracking-wide">CHAT SUPPORT</h3>
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