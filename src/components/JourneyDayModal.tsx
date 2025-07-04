import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Play, CheckCircle2, Clock, Target, Pause, RotateCcw } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

interface JourneyDayModalProps {
  day: number;
  dayData: {
    title: string;
    theme: string;
    duration: string;
    content: any;
  };
  isCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ActivityState {
  [key: string]: {
    completed: boolean;
    data?: any;
  };
}

const JourneyDayModal = ({ day, dayData, isCompleted, onClose, onComplete }: JourneyDayModalProps) => {
  const [activityStates, setActivityStates] = useState<ActivityState>({});
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { updateUserData, userData } = useUserData();
  const { toast } = useToast();

  // Load saved activity states
  useEffect(() => {
    const savedStates = userData?.journeyResponses || {};
    const dayStates: ActivityState = {};
    
    Object.keys(savedStates).forEach(key => {
      if (key.startsWith(`day_${day}_`)) {
        const activityKey = key.replace(`day_${day}_`, '');
        dayStates[activityKey] = {
          completed: true,
          data: savedStates[key]
        };
      }
    });
    
    setActivityStates(dayStates);
    
    // Set current activity index based on completed activities
    const completedCount = Object.keys(dayStates).length;
    setCurrentActivityIndex(completedCount);
  }, [day, userData]);

  const markActivityComplete = (activityKey: string, data?: any) => {
    const newStates = {
      ...activityStates,
      [activityKey]: { completed: true, data }
    };
    setActivityStates(newStates);
    
    // Save to user data
    updateUserData({
      journeyResponses: {
        ...userData?.journeyResponses,
        [`day_${day}_${activityKey}`]: data || true
      }
    });
    
    // Move to next activity
    setCurrentActivityIndex(prev => prev + 1);
    
    toast({
      title: "Activity Complete!",
      description: "Great progress! Moving to the next activity.",
    });
  };

  const simulateAudioPlay = (activityKey: string) => {
    if (isAudioPlaying) return;
    
    setIsAudioPlaying(true);
    setAudioProgress(0);
    
    const interval = setInterval(() => {
      setAudioProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAudioPlaying(false);
          markActivityComplete(activityKey);
          return 100;
        }
        return prev + 1.67; // 1.67% every 100ms = 60 seconds (2 min) total
      });
    }, 100);
  };

  const openBreathingExercise = () => {
    // In a real app, this would open the breathing component
    toast({
      title: "Breathing Exercise Started",
      description: "Take deep breaths and focus on your recovery journey.",
    });
    
    // Simulate completion after 3 seconds
    setTimeout(() => {
      markActivityComplete('breathing_exercise');
    }, 3000);
  };

  const getAllActivitiesForDay = (dayNum: number) => {
    switch (dayNum) {
      case 1:
        return [
          { key: 'welcome_audio', title: 'Welcome Message (2 min.)', type: 'audio' },
          { key: 'how_recovery_works', title: 'How Recovery Works', type: 'carousel' },
          { key: 'why_here', title: 'Your Why', type: 'text_input' }
        ];
      case 2:
        return [
          { key: 'trigger_audio', title: 'Understanding Triggers', type: 'audio' },
          { key: 'trigger_education', title: 'Trigger Education', type: 'slides' },
          { key: 'breathing_exercise', title: 'Pause & Breathe', type: 'interactive' },
          { key: 'top_triggers', title: 'Your Top Triggers', type: 'form' }
        ];
      default:
        return [
          { key: 'content', title: dayData.title, type: 'placeholder' }
        ];
    }
  };

  const activities = getAllActivitiesForDay(day);
  const completedActivities = Object.keys(activityStates).length;
  const allActivitiesComplete = completedActivities >= activities.length;
  const dayProgress = (completedActivities / activities.length) * 100;

  const renderActivity = (activity: any, index: number) => {
    const isActive = index <= currentActivityIndex;
    const isCompleted = activityStates[activity.key]?.completed || false;
    
    if (!isActive && !isCompleted) {
      return (
        <Card key={activity.key} className="bg-steel-dark/30 border-steel-dark p-4 opacity-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-steel-dark rounded-full flex items-center justify-center">
              <span className="text-steel-light text-sm">{index + 1}</span>
            </div>
            <div>
              <h4 className="font-oswald font-semibold text-steel-light">{activity.title}</h4>
              <p className="text-steel-light text-sm">Complete previous activity to unlock</p>
            </div>
          </div>
        </Card>
      );
    }

    switch (activity.type) {
      case 'audio':
        return (
          <Card key={activity.key} className={`border-steel-dark p-4 ${isCompleted ? 'bg-construction/10 border-construction/20' : 'bg-white/10'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-construction' : 'bg-construction'}`}>
                {isCompleted ? <CheckCircle2 className="text-midnight" size={16} /> : <Play className="text-midnight" size={16} />}
              </div>
              <h4 className="font-oswald font-semibold text-white">{activity.title}</h4>
            </div>
            
            {activity.key === 'welcome_audio' && (
              <p className="text-steel-light text-sm mb-3">Welcome to LEAP - Your recovery journey starts here</p>
            )}
            
            {activity.key === 'trigger_audio' && (
              <p className="text-steel-light text-sm mb-3">AI-narrated walkthrough of trigger types (1 minute)</p>
            )}
            
            {isAudioPlaying && (
              <div className="mb-3">
                <Progress value={audioProgress} className="h-2" />
                <p className="text-steel-light text-xs mt-1">Playing... {Math.round(audioProgress)}%</p>
              </div>
            )}
            
            <div className="flex space-x-2">
              {!isCompleted ? (
                <Button 
                  onClick={() => simulateAudioPlay(activity.key)}
                  disabled={isAudioPlaying}
                  className="bg-construction hover:bg-construction-dark text-midnight font-oswald"
                >
                  {isAudioPlaying ? (
                    <>
                      <Pause size={16} className="mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Play Welcome Message
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => simulateAudioPlay(activity.key)}
                  className="bg-construction/20 hover:bg-construction/30 text-construction border border-construction font-oswald"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Replay
                </Button>
              )}
            </div>
          </Card>
        );

      case 'carousel':
        return (
          <Card key={activity.key} className={`border-steel-dark p-4 ${isCompleted ? 'bg-construction/10 border-construction/20' : 'bg-white/10'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-construction' : 'bg-construction'}`}>
                {isCompleted ? <CheckCircle2 className="text-midnight" size={16} /> : <span className="text-midnight text-sm">{index + 1}</span>}
              </div>
              <h4 className="font-oswald font-semibold text-white">{activity.title}</h4>
            </div>
            <p className="text-steel-light text-sm mb-4">Swipe through these 3 slides about recovery</p>
            
            <div className="mb-4">
              <Carousel 
                className="w-full max-w-md mx-auto"
                opts={{
                  align: "start",
                  loop: false,
                }}
                setApi={(api) => {
                  if (api) {
                    api.on('select', () => {
                      setCarouselIndex(api.selectedScrollSnap());
                    });
                  }
                }}
              >
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-1">
                      <img 
                        src="/lovable-uploads/119b2322-45f6-44de-b789-4c906de98f49.png" 
                        alt="Recovery Isn't Linear" 
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-1">
                      <img 
                        src="/lovable-uploads/94dda5cd-ec41-4605-a800-00f362310a18.png" 
                        alt="Recovery Requires Rebuilding" 
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-1">
                      <img 
                        src="/lovable-uploads/cffae2dd-2b00-4023-8687-7ad85f03f749.png" 
                        alt="Recovery Is Personal—and Possible" 
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
              
              {/* Pagination dots */}
              <div className="flex justify-center space-x-2 mt-4">
                {[0, 1, 2].map((dotIndex) => (
                  <div
                    key={dotIndex}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      dotIndex === carouselIndex ? 'bg-construction' : 'bg-steel-dark'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {!isCompleted ? (
              <Button 
                onClick={() => markActivityComplete(activity.key)}
                className="bg-construction hover:bg-construction-dark text-midnight font-oswald w-full"
              >
                Continue to Next Activity
              </Button>
            ) : (
              <div className="flex items-center space-x-2 text-construction justify-center">
                <CheckCircle2 size={16} />
                <span className="font-oswald">Slides Complete</span>
              </div>
            )}
          </Card>
        );

      case 'interactive':
        return (
          <Card key={activity.key} className={`border-steel-dark p-4 ${isCompleted ? 'bg-construction/10 border-construction/20' : 'bg-white/10'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-construction' : 'bg-construction'}`}>
                {isCompleted ? <CheckCircle2 className="text-midnight" size={16} /> : <span className="text-midnight text-sm">{index + 1}</span>}
              </div>
              <h4 className="font-oswald font-semibold text-white">{activity.title}</h4>
            </div>
            <p className="text-steel-light text-sm mb-3">Interactive breathing exercise when triggered</p>
            
            {!isCompleted ? (
              <Button 
                onClick={openBreathingExercise}
                className="bg-construction hover:bg-construction-dark text-midnight font-oswald"
              >
                Start Breathing Exercise
              </Button>
            ) : (
              <div className="flex items-center space-x-2 text-construction">
                <CheckCircle2 size={16} />
                <span className="font-oswald">Exercise Complete</span>
              </div>
            )}
          </Card>
        );

      case 'text_input':
        return (
          <Card key={activity.key} className={`border-steel-dark p-4 ${isCompleted ? 'bg-construction/10 border-construction/20' : 'bg-white/10'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-construction' : 'bg-construction'}`}>
                {isCompleted ? <CheckCircle2 className="text-midnight" size={16} /> : <span className="text-midnight text-sm">{index + 1}</span>}
              </div>
              <h4 className="font-oswald font-semibold text-white">{activity.title}</h4>
            </div>
            <p className="text-steel-light text-sm mb-3">Complete this sentence: "I'm here because ______."</p>
            
            <div className="space-y-3">
              <textarea
                className="w-full bg-steel-dark text-white p-3 rounded-lg border border-steel resize-none"
                rows={3}
                placeholder="I'm here because..."
                defaultValue={activityStates[activity.key]?.data || ''}
                disabled={isCompleted}
              />
              
              {!isCompleted && (
                <Button 
                  onClick={() => {
                    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                    if (textarea?.value.trim()) {
                      markActivityComplete(activity.key, textarea.value);
                    }
                  }}
                  className="bg-construction hover:bg-construction-dark text-midnight font-oswald"
                >
                  Save Response
                </Button>
              )}
            </div>
          </Card>
        );

      case 'form':
        return (
          <Card key={activity.key} className={`border-steel-dark p-4 ${isCompleted ? 'bg-construction/10 border-construction/20' : 'bg-white/10'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-construction' : 'bg-construction'}`}>
                {isCompleted ? <CheckCircle2 className="text-midnight" size={16} /> : <span className="text-midnight text-sm">{index + 1}</span>}
              </div>
              <h4 className="font-oswald font-semibold text-white">{activity.title}</h4>
            </div>
            <p className="text-steel-light text-sm mb-3">What are your top 2 triggers?</p>
            
            <div className="space-y-3">
              <input
                type="text"
                className="w-full bg-steel-dark text-white p-3 rounded-lg border border-steel"
                placeholder="Trigger #1"
                disabled={isCompleted}
                defaultValue={activityStates[activity.key]?.data?.trigger1 || ''}
              />
              <input
                type="text"
                className="w-full bg-steel-dark text-white p-3 rounded-lg border border-steel"
                placeholder="Trigger #2"
                disabled={isCompleted}
                defaultValue={activityStates[activity.key]?.data?.trigger2 || ''}
              />
              
              {!isCompleted && (
                <Button 
                  onClick={() => {
                    const inputs = document.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
                    const trigger1 = inputs[inputs.length - 2]?.value || '';
                    const trigger2 = inputs[inputs.length - 1]?.value || '';
                    
                    if (trigger1.trim() && trigger2.trim()) {
                      markActivityComplete(activity.key, { trigger1, trigger2 });
                    }
                  }}
                  className="bg-construction hover:bg-construction-dark text-midnight font-oswald"
                >
                  Save Triggers
                </Button>
              )}
            </div>
          </Card>
        );

      default:
        return (
          <Card key={activity.key} className="bg-white/10 border-steel-dark p-4">
            <h4 className="font-oswald font-semibold text-white mb-3">{activity.title}</h4>
            <p className="text-steel-light">Day {day} content will be implemented with specific interactive elements.</p>
            
            {!isCompleted && (
              <Button 
                onClick={() => markActivityComplete(activity.key)}
                className="bg-construction hover:bg-construction-dark text-midnight font-oswald mt-3"
              >
                Mark Complete
              </Button>
            )}
          </Card>
        );
    }
  };

  const handleCompleteDay = () => {
    if (!allActivitiesComplete) return;
    
    const existingProgress = JSON.parse(localStorage.getItem('journeyProgress') || '{}');
    const completedDays = existingProgress.completedDays || [];
    
    if (!completedDays.includes(day)) {
      const updatedProgress = {
        ...existingProgress,
        completedDays: [...completedDays, day]
      };
      localStorage.setItem('journeyProgress', JSON.stringify(updatedProgress));
      
      updateUserData({
        journeyProgress: updatedProgress
      });
    }
    
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-[#1A2642] border-[#F9D058] border-[1px] max-w-lg w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-steel-dark">
          <div className="flex items-center space-x-3">
            <div className="bg-construction p-2 rounded-lg">
              <Target className="text-midnight" size={20} />
            </div>
            <div>
              <h2 className="font-oswald font-bold text-white">Day {day}</h2>
              <p className="text-steel-light text-sm">{dayData.theme} • {dayData.duration}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-steel-light hover:text-white"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="p-6 border-b border-steel-dark">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-steel-light">Progress</span>
            <span className="text-construction font-oswald font-bold">{completedActivities}/{activities.length}</span>
          </div>
          <Progress value={dayProgress} className="h-2 bg-steel-dark">
            <div 
              className="h-full bg-gradient-to-r from-[#F9D058] to-[#FBE89D] rounded-full transition-all duration-500"
              style={{ width: `${dayProgress}%` }}
            />
          </Progress>
          
          {/* Activity dots */}
          <div className="flex justify-center space-x-2 mt-3">
            {activities.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < completedActivities
                    ? 'bg-construction'
                    : index === currentActivityIndex
                      ? 'bg-construction/50'
                      : 'bg-steel-dark'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-oswald font-semibold text-white text-xl mb-4">
            {dayData.title}
          </h3>
          
          <div className="space-y-4">
            {activities.map((activity, index) => renderActivity(activity, index))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-steel-dark">
          <div className="flex items-center space-x-2 text-sm text-steel-light">
            <Clock size={16} className="text-construction" />
            <span>{dayData.duration}</span>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-steel text-steel-light hover:bg-steel/10"
            >
              Close
            </Button>
            
            {!isCompleted && (
              <Button
                onClick={handleCompleteDay}
                disabled={!allActivitiesComplete}
                className={`font-oswald font-semibold ${
                  allActivitiesComplete
                    ? 'bg-construction hover:bg-construction-dark text-midnight'
                    : 'bg-steel-dark text-steel-light cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={16} className="mr-2" />
                {allActivitiesComplete ? 'Complete Day' : `Complete ${activities.length - completedActivities} more`}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JourneyDayModal;
