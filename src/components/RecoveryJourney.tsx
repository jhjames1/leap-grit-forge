import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Play, Clock, Target, Trophy } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import JourneyDayModal from './JourneyDayModal';

const RecoveryJourney = () => {
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { userData, logActivity } = useUserData();
  const { toast } = useToast();
  const totalDays = 90;
  
  // Calculate current day based on completed days
  const completedDays = userData?.journeyProgress?.completedDays || [];
  const actualCurrentDay = Math.min(Math.max(...completedDays, 0) + 1, totalDays);

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
            title: "LEAP Reminder",
            description: "You've got 12 hours left to complete today's LEAP. Keep going—you're doing great.",
          });
        } else if (Math.abs(hoursRemaining - 3) < 0.5) {
          toast({
            title: "Almost There",
            description: "Almost there. Let's finish strong.",
          });
        } else if (Math.abs(hoursRemaining - 1) < 0.5) {
          toast({
            title: "Final Hour",
            description: "One hour left today. Let's LEAP!",
          });
        }
      }
    };

    // Check every hour
    const interval = setInterval(checkDayReminders, 60 * 60 * 1000);
    checkDayReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [currentDay, userData, toast]);

  const week1Days = [
    {
      day: 1,
      title: "Starting Your Journey",
      theme: "Foundation",
      duration: "5 min",
      content: {
        type: "foundation",
        audio: "AI-generated welcome audio (2 min)",
        slides: "3-slide swipe: How Recovery Works",
        prompt: "I'm here because ______."
      }
    },
    {
      day: 2,
      title: "Understanding Triggers",
      theme: "Awareness", 
      duration: "7 min",
      content: {
        type: "awareness",
        audio: "AI-narrated trigger types walkthrough (1 min)",
        slides: "6-slide carousel: Internal vs. external triggers",
        interactive: "Breathing tool integration",
        form: "What are your top 2 triggers?"
      }
    },
    {
      day: 3,
      title: "Building Your Support Network",
      theme: "Connection",
      duration: "7 min", 
      content: {
        type: "connection",
        categories: "Select: one person, one group, one self-tool",
        visual: "Support triangle with checkboxes",
        audio: "AI peer recovery support tips (1 min)"
      }
    },
    {
      day: 4,
      title: "Why You Want to Recover",
      theme: "Motivation",
      duration: "5 min",
      content: {
        type: "motivation",
        input: "3 reasons for recovery",
        highlight: "Select primary 'why'",
        audio: "AI affirmation: 'You are worthy of the life you imagine.'"
      }
    },
    {
      day: 5,
      title: "Naming the Real Enemy", 
      theme: "Identity",
      duration: "6 min",
      content: {
        type: "identity",
        interactive: "Drag-and-drop: 3 addiction vs. 3 positive traits",
        visual: "Side-by-side comparison card",
        audio: "AI voiceover: 'You are not broken. You are becoming.' (90 sec)"
      }
    },
    {
      day: 6,
      title: "Creating Your Safe Space",
      theme: "Environment", 
      duration: "6 min",
      content: {
        type: "environment",
        checklist: "Pick 1: Declutter nightstand, wallet, app folder",
        task: "Complete button to track",
        ambient: "Optional calming background sounds"
      }
    },
    {
      day: 7,
      title: "One Week Strong – Quick Reflection",
      theme: "Reflection",
      duration: "5 min",
      content: {
        type: "reflection", 
        rating: "Tap-to-rate 5 weekly milestones",
        response: "'What I'm proud of' free response",
        audio: "AI peer celebration milestone (30 sec)",
        badge: "Unlock Week 1 Badge"
      }
    }
  ];

  const handleDayClick = (day: number) => {
    // Updated unlocking logic: must be past 12:01 AM AND previous day completed
    const isPreviousDayCompleted = day === 1 || completedDays.includes(day - 1);
    const isUnlocked = isPast1201AM() && isPreviousDayCompleted;
    const isCompleted = completedDays.includes(day);
    
    if (isUnlocked || isCompleted) {
      setSelectedDay(day);
      logActivity(`Opened Day ${day}: ${week1Days[day - 1]?.title}`);
    } else {
      let reason = "";
      if (!isPast1201AM()) {
        reason = "Days unlock at 12:01 AM each day";
      } else if (!isPreviousDayCompleted) {
        reason = `Complete Day ${day - 1} first to unlock this day`;
      }
      
      toast({
        title: "Day Locked",
        description: reason,
      });
    }
  };

  const handleCompleteDay = (day: number) => {
    logActivity(`Completed Day ${day}: ${week1Days[day - 1]?.title}`);
    
    // Update current day if this was the active day
    if (day === actualCurrentDay && day < totalDays) {
      setCurrentDay(day + 1);
    }
    
    setSelectedDay(null);
    
    if (day === 7) {
      toast({
        title: "Week 1 Complete! 🏆",
        description: "You've unlocked your Week 1 Badge. Amazing progress!",
      });
    } else {
      toast({
        title: `Day ${day} Complete! ✅`,
        description: "Great work! You're building strong recovery foundations.",
      });
    }
  };

  const getDayStatus = (day: number) => {
    if (completedDays.includes(day)) return 'completed';
    const isPreviousDayCompleted = day === 1 || completedDays.includes(day - 1);
    if (isPast1201AM() && isPreviousDayCompleted) return 'unlocked';
    return 'locked';
  };

  const getButtonText = (day: number, status: string) => {
    if (status === 'completed') return 'Review';
    if (status === 'unlocked') return 'Start';
    return 'Locked';
  };

  const progress = (actualCurrentDay / totalDays) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          <span className="font-oswald font-extralight tracking-tight">RECOVERY</span><span className="font-fjalla font-extrabold italic">JOURNEY</span>
        </h1>
        <p className="text-steel-light font-oswald">90-day guided track</p>
      </div>

      {/* Overall Progress Card */}
      <Card className="bg-[#1A2642]/75 backdrop-blur-sm border-[#F9D058] border-[1px] mb-6 p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction p-2 rounded-lg">
            <Target className="text-midnight" size={20} />
          </div>
          <div>
            <h3 className="font-oswald font-semibold text-white">Overall Progress</h3>
            <p className="text-steel-light text-sm">
              Day <span className="text-construction font-bold text-lg">{actualCurrentDay}</span> of {totalDays}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-steel-light">Journey Progress</span>
            <span className="text-construction font-oswald font-bold text-lg">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-steel-dark">
            <div 
              className="h-full bg-gradient-to-r from-[#F9D058] to-[#FBE89D] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </Progress>
        </div>
      </Card>

      {/* Week 1: Foundation */}
      <Card className="bg-[#1A2642]/75 backdrop-blur-sm border-[#F9D058] border-[1px] mb-6 p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction p-2 rounded-lg">
            <Trophy className="text-midnight" size={20} />
          </div>
          <h3 className="font-oswald font-semibold text-white">Week 1: Foundation</h3>
        </div>
        
        <div className="space-y-3">
          {week1Days.map((dayModule) => {
            const status = getDayStatus(dayModule.day);
            const isCompleted = status === 'completed';
            const isUnlocked = status === 'unlocked' || isCompleted;
            const buttonText = getButtonText(dayModule.day, status);
            
            return (
              <Card
                key={dayModule.day}
                onClick={() => isUnlocked && handleDayClick(dayModule.day)}
                className={`border-steel-dark p-4 transition-all duration-200 ${
                  isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${
                  isCompleted
                    ? 'bg-construction/10 border-construction/30'
                    : isUnlocked
                      ? 'bg-white/10 backdrop-blur-sm hover:bg-white/15 hover:border-construction/20'
                      : 'bg-steel-dark/20 border-steel-dark/50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-construction'
                      : isUnlocked
                        ? 'bg-construction'
                        : 'bg-steel-dark'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="text-midnight" size={20} />
                    ) : isUnlocked ? (
                      <Play className="text-midnight" size={20} />
                    ) : (
                      <Lock className="text-steel-light" size={20} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-oswald font-bold text-construction text-sm">
                        DAY {dayModule.day}
                      </span>
                      <span className="text-steel-light text-xs">•</span>
                      <span className="text-steel-light text-xs font-oswald uppercase tracking-wide">
                        {dayModule.theme}
                      </span>
                    </div>
                    
                    <h3 className={`font-oswald font-medium mb-1 ${
                      isUnlocked ? 'text-white' : 'text-steel-light'
                    }`}>
                      {dayModule.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2 text-xs text-steel-light">
                      <Clock size={12} className="text-construction" />
                      <span>{dayModule.duration}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`font-oswald font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                      !isUnlocked
                        ? 'bg-steel-dark text-steel-light cursor-not-allowed border border-steel-dark'
                        : isCompleted 
                          ? 'border-construction text-construction hover:bg-construction/10 bg-transparent border'
                          : 'bg-construction hover:bg-construction-dark text-midnight shadow-lg hover:shadow-construction/20'
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

      {/* Week 1 Progress Summary */}
      <Card className="bg-white/5 backdrop-blur-sm border-steel-dark p-6 rounded-lg">
        <h3 className="font-oswald font-semibold text-white mb-3">Week 1 Progress</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-steel-light">Days Completed</span>
            <span className="text-construction font-oswald font-bold">
              {completedDays.filter(day => day <= 7).length} / 7
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel-light">Foundation Strength</span>
            <span className="text-construction font-oswald font-bold">
              {Math.round((completedDays.filter(day => day <= 7).length / 7) * 100)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Day Modal */}
      {selectedDay && (
        <JourneyDayModal
          day={selectedDay}
          dayData={week1Days[selectedDay - 1]}
          isCompleted={completedDays.includes(selectedDay)}
          onClose={() => setSelectedDay(null)}
          onComplete={() => handleCompleteDay(selectedDay)}
        />
      )}
      </div>
    </div>
  );
};

export default RecoveryJourney;
