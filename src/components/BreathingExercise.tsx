import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Wind, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BreathingExerciseProps {
  onClose: () => void;
  onCancel?: () => void;
}

const BreathingExercise = ({ onClose, onCancel }: BreathingExerciseProps) => {
  const [isStarted, setIsStarted] = useState(false);
  const [sessionLength, setSessionLength] = useState(90);
  const [backgroundSound, setBackgroundSound] = useState('');
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [circleScale, setCircleScale] = useState(1);
  const [backgroundSounds, setBackgroundSounds] = useState<Array<{id: string, title: string, media_url: string}>>([]);
  const [voiceGuidance, setVoiceGuidance] = useState<Array<{id: string, title: string, media_url: string}>>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const breathTimerRef = useRef<NodeJS.Timeout>();

  // Fallback background sounds if no database content is available
  const fallbackBackgroundSounds = [
    { id: 'workshop', title: 'Workshop Hum', media_url: '' },
    { id: 'wind', title: 'West Texas Wind', media_url: '' },
    { id: 'campfire', title: 'Campfire Crackle', media_url: '' },
    { id: 'silent', title: 'Silent Mode', media_url: '' }
  ];

  const breathingPattern = {
    inhale: 4000,  // 4 seconds
    hold: 7000,    // 7 seconds  
    exhale: 8000,  // 8 seconds
    rest: 1000     // 1 second
  };

  const voicePrompts = {
    inhale: "Inhale slow and steady",
    hold: "Hold it, stay with me",
    exhale: "Now exhale, let that tension drain",
    rest: "You're steady, you're solid"
  };

  const startSession = () => {
    setIsStarted(true);
    setIsPlaying(true);
    setTimeLeft(sessionLength);
    setBreathCount(0);
    startBackgroundAudio();
    startBreathingCycle();
    
    // Main session timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startBackgroundAudio = () => {
    const selectedSound = backgroundSounds.find(sound => sound.id === backgroundSound);
    if (selectedSound && selectedSound.media_url && selectedSound.id !== 'silent') {
      const audio = new Audio(selectedSound.media_url);
      audio.loop = true;
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.log('Audio autoplay prevented:', error);
      });
      setAudioElement(audio);
    }
  };

  const stopBackgroundAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
  };

  const startBreathingCycle = () => {
    const runCycle = () => {
      // Inhale phase
      setCurrentPhase('inhale');
      setCircleScale(1.8);
      if (voiceGuideEnabled) {
        speakText(voicePrompts.inhale);
      }
      
      setTimeout(() => {
        // Hold phase
        setCurrentPhase('hold');
        if (voiceGuideEnabled) {
          speakText(voicePrompts.hold);
        }
        
        setTimeout(() => {
          // Exhale phase
          setCurrentPhase('exhale');
          setCircleScale(1);
          if (voiceGuideEnabled) {
            speakText(voicePrompts.exhale);
          }
          
          setTimeout(() => {
            // Rest phase
            setCurrentPhase('rest');
            setBreathCount(prev => prev + 1);
            if (voiceGuideEnabled && Math.random() > 0.7) {
              speakText(voicePrompts.rest);
            }
            
            setTimeout(() => {
              if (isPlaying) {
                runCycle();
              }
            }, breathingPattern.rest);
          }, breathingPattern.exhale);
        }, breathingPattern.hold);
      }, breathingPattern.inhale);
    };
    
    runCycle();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any existing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure for British female voice
      const voices = speechSynthesis.getVoices();
      const britishFemale = voices.find(voice => 
        voice.lang.includes('en-GB') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => 
        voice.lang.includes('en-GB')
      ) || voices.find(voice => 
        voice.name.toLowerCase().includes('karen') || voice.name.toLowerCase().includes('amy')
      );
      
      if (britishFemale) {
        utterance.voice = britishFemale;
      }
      
      utterance.rate = 0.8;
      utterance.pitch = 0.9;
      utterance.volume = 0.7;
      
      speechSynthesis.speak(utterance);
    }
  };

  const pauseSession = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeSession = () => {
    setIsPlaying(true);
    startBreathingCycle();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endSession = () => {
    setIsPlaying(false);
    stopBackgroundAudio();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Show completion message with British female voice
    const completionMessages = [
      "That's what slowing down feels like. Solid work.",
      "Good move. You just reset your system.",
      "Steady breathing, steady mind. Well done."
    ];
    
    const message = completionMessages[Math.floor(Math.random() * completionMessages.length)];
    
    if (voiceGuideEnabled) {
      speakText(message);
    }
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const resetSession = () => {
    setIsStarted(false);
    setIsPlaying(false);
    setTimeLeft(sessionLength);
    setBreathCount(0);
    setCircleScale(1);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    speechSynthesis.cancel();
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // Fetch audio content from database
  useEffect(() => {
    const fetchAudioContent = async () => {
      try {
        const { data, error } = await supabase
          .from('foreman_content')
          .select('id, title, media_url')
          .eq('category', 'breathing_exercises')
          .eq('is_active', true)
          .not('media_url', 'is', null)
          .not('media_url', 'eq', '');

        if (error) throw error;

        if (data && data.length > 0) {
          // Separate background sounds and voice guidance based on title
          const backgroundAudio = data.filter(item => 
            item.title.toLowerCase().includes('background') || 
            item.title.toLowerCase().includes('sound')
          );
          const voiceAudio = data.filter(item => 
            item.title.toLowerCase().includes('voice') || 
            item.title.toLowerCase().includes('guidance')
          );

          setBackgroundSounds(backgroundAudio.length > 0 ? backgroundAudio : fallbackBackgroundSounds);
          setVoiceGuidance(voiceAudio);
          
          // Set default background sound
          if (backgroundAudio.length > 0) {
            setBackgroundSound(backgroundAudio[0].id);
          }
        } else {
          setBackgroundSounds(fallbackBackgroundSounds);
        }
      } catch (error) {
        console.error('Error fetching audio content:', error);
        setBackgroundSounds(fallbackBackgroundSounds);
      }
    };

    fetchAudioContent();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      speechSynthesis.cancel();
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  if (!isStarted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="bg-midnight border-steel-dark p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-6">
              <Wind className="text-construction" size={32} />
            </div>
            
            <h2 className="font-oswald font-bold text-white text-2xl mb-2">SteadySteel</h2>
            <p className="text-steel-light text-sm mb-6 leading-relaxed">
              Feel that pressure in your chest? Let's ease it out.
            </p>

            {/* Session Length */}
            <div className="mb-6">
              <label className="block text-white font-oswald font-semibold mb-3">
                Session Length: <span className="text-construction">{sessionLength}s</span>
              </label>
              <Slider
                value={[sessionLength]}
                onValueChange={(value) => setSessionLength(value[0])}
                min={60}
                max={180}
                step={30}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-steel-light mt-2">
                <span>60s</span>
                <span>90s</span>
                <span>120s</span>
                <span>150s</span>
                <span>180s</span>
              </div>
            </div>

            {/* Background Sound */}
            <div className="mb-6">
              <label className="block text-white font-oswald font-semibold mb-3">Background Sound</label>
              <div className="grid grid-cols-2 gap-2">
                {backgroundSounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant={backgroundSound === sound.id ? "default" : "outline"}
                    onClick={() => setBackgroundSound(sound.id)}
                    className={`text-xs ${
                      backgroundSound === sound.id 
                        ? 'bg-construction text-midnight' 
                        : 'border-steel text-steel-light hover:bg-steel/10'
                    }`}
                  >
                    {sound.title}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Guide */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-white font-oswald font-medium">Voice Guide (British Female)</span>
              <div className="flex items-center space-x-2">
                {voiceGuideEnabled ? <Volume2 size={16} className="text-construction" /> : <VolumeX size={16} className="text-steel" />}
                <Switch
                  checked={voiceGuideEnabled}
                  onCheckedChange={setVoiceGuideEnabled}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={startSession}
                className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-bold py-3"
              >
                <Play className="mr-2" size={20} />
                Start Session
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="w-full border-steel text-steel-light hover:bg-steel/10"
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
      <Card className="bg-midnight/50 backdrop-blur-sm border-steel-dark p-8 max-w-md w-full">
        <div className="text-center">
          {/* Header */}
          <div className="mb-8">
            <h3 className="font-oswald font-bold text-white text-xl mb-2">SteadySteel</h3>
            <p className="text-construction font-oswald font-semibold">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>

          {/* Breathing Animation */}
          <div className="mb-8 relative">
            <div 
              className={`w-32 h-32 mx-auto rounded-full border-4 transition-all duration-[4000ms] ease-in-out ${
                currentPhase === 'inhale' ? 'border-construction bg-construction/20' : 
                currentPhase === 'hold' ? 'border-construction-light bg-construction/30' :
                currentPhase === 'exhale' ? 'border-steel bg-steel/20' :
                'border-steel-light bg-steel/10'
              }`}
              style={{ transform: `scale(${circleScale})` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-oswald font-semibold text-lg capitalize">
                {currentPhase}
              </span>
            </div>
          </div>

          {/* Progress Info */}
          <div className="mb-6 text-center">
            <p className="text-steel-light text-sm mb-2">
              Breath Cycle: <span className="text-construction font-bold">{breathCount}</span>
            </p>
            <div className="w-full bg-steel-dark rounded-full h-2">
              <div 
                className="bg-construction h-2 rounded-full transition-all duration-300"
                style={{ width: `${((sessionLength - timeLeft) / sessionLength) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isPlaying ? pauseSession : resumeSession}
              className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold px-6"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button
              onClick={resetSession}
              variant="outline"
              className="border-steel text-steel-light hover:bg-steel/10 px-6"
            >
              <RotateCcw size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BreathingExercise;
