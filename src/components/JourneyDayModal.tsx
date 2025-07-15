import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Play, CheckCircle2, Clock, Target, Pause, RotateCcw } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useAudio } from '@/hooks/useAudio';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';

interface JourneyDayModalProps {
  day: number;
  dayData: {
    title: string;
    keyMessage: string;
    activity: string;
    tool: string;
    duration?: string;
    modifiedTone?: string;
    modifiedPacing?: string;
  };
  isCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNavigateToHome?: () => void;
}

interface ActivityState {
  [key: string]: {
    completed: boolean;
    data?: any;
  };
}

const JourneyDayModal = ({ day, dayData, isCompleted, onClose, onComplete, onNavigateToHome }: JourneyDayModalProps) => {
  const [activityStates, setActivityStates] = useState<ActivityState>({});
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [currentAudioActivity, setCurrentAudioActivity] = useState<string | null>(null);
  const { updateUserData, userData, logActivity } = useUserData();
  const { toast } = useToast();
  const { language, t } = useLanguage();

  // Audio URLs for different activities - language-aware
  const audioUrls = {
    welcome_audio: language === 'es' ? '/lovable-uploads/Welcome-to-LEAPes.mp3' : '/lovable-uploads/Welcome-to-LEAPen.mp3',
    trigger_audio: '' // Add more audio URLs as needed
  };

  logger.debug('JourneyDayModal initialized', { language });

  // Use audio hook for the current audio activity
  const currentAudioUrl = currentAudioActivity ? audioUrls[currentAudioActivity as keyof typeof audioUrls] : '';
  const {
    isPlaying: isAudioPlaying,
    isLoading: isAudioLoading,
    duration: audioDuration,
    currentTime: audioCurrentTime,
    progress: audioProgress,
    error: audioError,
    play: playAudio,
    pause: pauseAudio,
    stop: stopAudio
  } = useAudio(currentAudioUrl);

  // Load saved activity states
  useEffect(() => {
    const savedStates = userData?.journeyResponses || {};
    const dayStates: ActivityState = {};
    
    logger.debug('Loading activity states for day', { 
      day, 
      savedStates: Object.keys(savedStates).filter(key => key.startsWith(`day_${day}_`)),
      allSavedStates: Object.keys(savedStates)
    });
    
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
    
    logger.debug('Activity states loaded', { 
      day, 
      completedCount, 
      dayStates: Object.keys(dayStates)
    });
  }, [day, userData?.journeyResponses, userData?.lastAccess]);

  const markActivityComplete = (activityKey: string, data?: any) => {
    const newStates = {
      ...activityStates,
      [activityKey]: { completed: true, data }
    };
    setActivityStates(newStates);
    
    // Save to user data with enhanced logging
    const updatedResponses = {
      ...userData?.journeyResponses,
      [`day_${day}_${activityKey}`]: data || true
    };
    
    logger.debug('Marking activity complete', { 
      day, 
      activityKey, 
      data,
      updatedResponses: Object.keys(updatedResponses)
    });
    
    updateUserData({
      journeyResponses: updatedResponses
    });
    
    // Move to next activity
    setCurrentActivityIndex(prev => prev + 1);
    
    toast({
      title: "Activity Complete!",
      description: "Great progress! Moving to the next activity.",
    });
  };

  // Handle real audio playback
  const handleAudioPlay = (activityKey: string) => {
    setCurrentAudioActivity(activityKey);
    
    // Start playing when audio URL is set
    setTimeout(() => {
      if (audioUrls[activityKey as keyof typeof audioUrls]) {
        playAudio();
      }
    }, 100);
  };

  const handleAudioPause = () => {
    pauseAudio();
  };

  // Auto-complete when audio finishes - REMOVED
  // User must manually click complete button
  useEffect(() => {
    logger.debug('Audio state updated', {
      currentAudioActivity,
      isAudioPlaying,
      audioProgress,
      audioDuration
    });
    
    // Note: Auto-completion removed - user must manually complete activities
  }, [isAudioPlaying, audioProgress, audioDuration, currentAudioActivity]);

  const openToolActivity = (toolName: string, activityKey: string) => {
    switch (toolName) {
      case 'Breathing Exercise':
        toast({
          title: "Breathing Exercise Started",
          description: "Take deep breaths and focus on your recovery journey.",
        });
        break;
      case 'Urge Tracker':
        toast({
          title: "Urge Tracker Opened",
          description: "Track your urges and cravings to identify patterns.",
        });
        break;
      case 'Peer Support':
        toast({
          title: "Connecting with Peers",
          description: "Reach out to your support network for encouragement.",
        });
        break;
      default:
        toast({
          title: "Activity Started",
          description: "Complete this recovery tool activity.",
        });
    }
    
    // Simulate completion after 3 seconds
    setTimeout(() => {
      markActivityComplete(activityKey);
    }, 3000);
  };

  const getAllActivitiesForDay = (dayNum: number) => {
    // Create activities based on the tool mentioned in the journey data
    const toolName = dayData.tool || 'Urge Tracker';
    const activities = [];
    
    // Add tool-specific activity
    switch (toolName) {
      case 'Urge Tracker':
        activities.push({ 
          key: 'urge_tracking', 
          title: 'Track Your Progress', 
          type: 'interactive',
          description: dayData.activity 
        });
        break;
      case 'Breathing Exercise':
        activities.push({ 
          key: 'breathing_exercise', 
          title: 'Mindful Breathing', 
          type: 'interactive',
          description: dayData.activity 
        });
        break;
      case 'Gratitude Log':
        activities.push({ 
          key: 'gratitude_log', 
          title: 'Gratitude Practice', 
          type: 'text_input',
          description: dayData.activity 
        });
        break;
      case 'Peer Support':
        activities.push({ 
          key: 'peer_support', 
          title: 'Connect with Peers', 
          type: 'interactive',
          description: dayData.activity 
        });
        break;
      default:
        activities.push({ 
          key: 'activity', 
          title: dayData.title, 
          type: 'text_input',
          description: dayData.activity 
        });
    }
    
    // Add reflection activity for all days
    activities.push({
      key: 'reflection',
      title: 'Daily Reflection',
      type: 'text_input',
      description: 'How did today\'s activity help your recovery journey?'
    });
    
    return activities;
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
        <Card key={activity.key} className="bg-muted/30 border-0 shadow-none p-4 opacity-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-sm flex items-center justify-center">
              <span className="text-muted-foreground text-sm font-source">{index + 1}</span>
            </div>
            <div>
              <h4 className="font-fjalla font-bold text-muted-foreground uppercase tracking-wide">{activity.title}</h4>
              <p className="text-muted-foreground text-sm font-source">{t('common.unlock')}</p>
            </div>
          </div>
        </Card>
      );
    }

    switch (activity.type) {
      case 'audio':
        return (
          <Card key={activity.key} className={`border-0 shadow-none p-4 rounded-lg ${isCompleted ? 'bg-card/50' : 'bg-card'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isCompleted ? 'bg-primary' : 'bg-primary'}`}>
                {isCompleted ? <CheckCircle2 className="text-primary-foreground" size={16} /> : <Play className="text-primary-foreground" size={16} />}
              </div>
              <h4 className="font-fjalla font-bold text-card-foreground uppercase tracking-wide">{activity.title}</h4>
            </div>
            
            {activity.key === 'welcome_audio' && (
              <p className="text-muted-foreground text-sm mb-3 font-source">{dayData.keyMessage}</p>
            )}
            
            {activity.key === 'trigger_audio' && (
              <p className="text-muted-foreground text-sm mb-3 font-source">AI-narrated walkthrough of trigger types (1 minute)</p>
            )}
            
            {(isAudioPlaying && currentAudioActivity === activity.key) && (
              <div className="mb-3">
                <Progress value={audioProgress} className="h-2 bg-muted" />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground font-source">
                    {Math.floor(audioCurrentTime / 60)}:{String(Math.floor(audioCurrentTime % 60)).padStart(2, '0')}
                  </span>
                  <span className="text-muted-foreground font-source">
                    {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {isAudioLoading && currentAudioActivity === activity.key && (
              <div className="mb-3">
                <div className="text-muted-foreground text-sm font-source">Loading audio...</div>
              </div>
            )}

            {audioError && currentAudioActivity === activity.key && (
              <div className="mb-3">
                <div className="text-red-500 text-sm font-source">Failed to load audio. Please try again.</div>
              </div>
            )}
            
            <div className="flex space-x-2">
              {!isCompleted ? (
                <>
                  <Button 
                    onClick={() => {
                      if (isAudioPlaying && currentAudioActivity === activity.key) {
                        handleAudioPause();
                      } else {
                        handleAudioPlay(activity.key);
                      }
                    }}
                    disabled={isAudioLoading && currentAudioActivity === activity.key}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-source font-bold py-3 rounded-lg"
                  >
                    {(isAudioPlaying && currentAudioActivity === activity.key) ? (
                      <>
                        <Pause size={16} className="mr-2" />
                        {t('common.pause')}
                      </>
                    ) : (
                      <>
                        <Play size={16} className="mr-2" />
                        {t('common.play')}
                      </>
                    )}
                  </Button>
                  
                  {/* Manual completion button - appears 5 seconds before audio ends */}
                  {currentAudioActivity === activity.key && audioDuration > 0 && (audioDuration - audioCurrentTime <= 5) && (
                    <Button 
                      onClick={() => markActivityComplete(activity.key)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-source"
                      disabled={isCompleted}
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      {t('common.complete')}
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  onClick={() => handleAudioPlay(activity.key)}
                  className="bg-muted hover:bg-muted/80 text-muted-foreground border border-border font-source"
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
          <Card key={activity.key} className={`border-0 shadow-none p-4 rounded-lg ${isCompleted ? 'bg-card/50' : 'bg-card'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isCompleted ? 'bg-primary' : 'bg-primary'}`}>
                {isCompleted ? <CheckCircle2 className="text-primary-foreground" size={16} /> : <span className="text-primary-foreground text-sm font-source">{index + 1}</span>}
              </div>
              <h4 className="font-fjalla font-bold text-card-foreground uppercase tracking-wide">{activity.title}</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-4 font-source">{activity.description}</p>
            
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-source w-full"
              >
                {t('common.continue')}
              </Button>
            ) : (
              <div className="flex items-center space-x-2 text-primary justify-center">
                <CheckCircle2 size={16} />
                <span className="font-source">{t('common.completed')}</span>
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
            <p className="text-steel-light text-sm mb-3">{activity.description}</p>
            
            {!isCompleted ? (
              <Button 
                onClick={() => openToolActivity(dayData.tool, activity.key)}
                className="bg-construction hover:bg-construction-dark text-midnight font-oswald"
              >
                {activity.title === 'Mindful Breathing' ? 'Start Breathing' : `Start ${activity.title}`}
              </Button>
            ) : (
              <div className="flex items-center space-x-2 text-construction">
                <CheckCircle2 size={16} />
                <span className="font-oswald">Activity Complete</span>
              </div>
            )}
          </Card>
        );

      case 'text_input':
        return (
          <Card key={activity.key} className={`border-0 shadow-none p-4 rounded-lg ${isCompleted ? 'bg-card/50' : 'bg-card'}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isCompleted ? 'bg-primary' : 'bg-primary'}`}>
                {isCompleted ? <CheckCircle2 className="text-primary-foreground" size={16} /> : <span className="text-primary-foreground text-sm font-source">{index + 1}</span>}
              </div>
              <h4 className="font-fjalla font-bold text-card-foreground uppercase tracking-wide">{activity.title}</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-3 font-source">{activity.description}</p>
            
            <div className="space-y-3">
              <textarea
                className="w-full bg-muted text-card-foreground p-3 rounded-lg border border-border resize-none font-source"
                rows={3}
                placeholder={`${activity.description}...`}
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-source w-full"
                >
                  {t('common.continue')}
                </Button>
              )}
              
              {isCompleted && (
                <div className="flex items-center space-x-2 text-primary justify-center">
                  <CheckCircle2 size={16} />
                  <span className="font-source">{t('common.completed')}</span>
                </div>
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
                {t('common.markComplete')}
              </Button>
            )}
          </Card>
        );
    }
  };

  const handleCompleteDay = async () => {
    logger.debug('Starting day completion', { day, allActivitiesComplete, userData: !!userData });
    
    if (!allActivitiesComplete) {
      logger.warn('Attempted to complete day with incomplete activities', { 
        day, 
        completedActivities, 
        totalActivities: activities.length 
      });
      
      toast({
        title: "Activities Incomplete",
        description: "Please complete all activities before finishing the day.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Log the completion
      logActivity(`Completed Day ${day}: ${dayData.title}`, `All activities completed for ${dayData.tool}`, 'journey');
      logger.debug('Activity logged successfully');
      
      // Update journey progress with better error handling
      const currentProgress = userData?.journeyProgress || {
        completedDays: [],
        currentWeek: 1,
        badges: [],
        completionDates: {}
      };
      
      // Check if day is already completed
      if (currentProgress.completedDays.includes(day)) {
        logger.debug('Day already completed', { day });
        toast({
          title: "Day Already Completed",
          description: "This day has already been marked as complete.",
        });
        onComplete();
        return;
      }
      
      const updatedProgress = {
        ...currentProgress,
        completedDays: [...currentProgress.completedDays, day].sort((a, b) => a - b),
        completionDates: {
          ...currentProgress.completionDates,
          [day]: new Date().toISOString()
        }
      };

      logger.debug('Updating journey progress', { 
        previousCompletedDays: currentProgress.completedDays,
        newCompletedDays: updatedProgress.completedDays
      });
      
      // Update user data and ensure it's saved
      updateUserData({ journeyProgress: updatedProgress });
      
      // Wait a moment for the update to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      logger.debug('Journey progress updated successfully');
      
      // Show success toast
      toast({
        title: `Day ${day} Complete!`,
        description: "Great job! Your progress has been saved.",
      });
      
      // Call completion callback with a slight delay to ensure state sync
      setTimeout(() => {
        logger.debug('Calling onComplete callback');
        onComplete();
        
        // Navigate to home after another delay
        setTimeout(() => {
          if (onNavigateToHome) {
            logger.debug('Navigating to home');
            onNavigateToHome();
          }
        }, 500);
      }, 200);
      
    } catch (error) {
      logger.error('Error completing day', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-background border-0 shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-sm">
              <Target className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h2 className="font-fjalla font-bold text-foreground uppercase tracking-wide">{t('common.day')} {day}</h2>
              <p className="text-muted-foreground text-sm font-source">{dayData.tool} • {dayData.duration}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-source">{t('common.progress')}</span>
            <span className="text-primary font-source font-bold">{completedActivities}/{activities.length}</span>
          </div>
          <Progress value={dayProgress} className="h-2 bg-muted" />
          
          {/* Activity dots */}
          <div className="flex justify-center space-x-2 mt-3">
            {activities.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < completedActivities
                    ? 'bg-primary'
                    : index === currentActivityIndex
                      ? 'bg-primary/50'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-fjalla font-bold text-foreground text-xl mb-4 uppercase tracking-wide">
            {dayData.title}
          </h3>
          
          <div className="space-y-4">
            {activities.map((activity, index) => renderActivity(activity, index))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock size={16} className="text-primary" />
            <span className="font-source">{dayData.duration}</span>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground hover:bg-muted font-source"
            >
              {t('common.close')}
            </Button>
            
            {!isCompleted && (
              <Button
                onClick={handleCompleteDay}
                disabled={!allActivitiesComplete}
                className={`font-source font-bold ${
                  allActivitiesComplete
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={16} className="mr-2" />
                {allActivitiesComplete ? t('common.completeDay') : t('common.completeMore', { count: activities.length - completedActivities })}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JourneyDayModal;
