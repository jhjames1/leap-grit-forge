
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Play, CheckCircle2, Clock, Target } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';

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

const JourneyDayModal = ({ day, dayData, isCompleted, onClose, onComplete }: JourneyDayModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const { updateUserData } = useUserData();

  const handleResponseSave = (key: string, value: string) => {
    const newResponses = { ...userResponses, [key]: value };
    setUserResponses(newResponses);
    
    // Save to user data
    updateUserData({
      journeyResponses: {
        ...userResponses,
        [`day_${day}_${key}`]: value
      }
    });
  };

  const handleComplete = () => {
    // Update completed days
    const existingProgress = JSON.parse(localStorage.getItem('journeyProgress') || '{}');
    const completedDays = existingProgress.completedDays || [];
    
    if (!completedDays.includes(day)) {
      const updatedProgress = {
        ...existingProgress,
        completedDays: [...completedDays, day]
      };
      localStorage.setItem('journeyProgress', JSON.stringify(updatedProgress));
      
      // Update user data
      updateUserData({
        journeyProgress: updatedProgress
      });
    }
    
    onComplete();
  };

  const renderDayContent = () => {
    switch (day) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Welcome Audio */}
            <Card className="bg-construction/10 border-construction/20 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Play className="text-construction" size={20} />
                <h4 className="font-oswald font-semibold text-white">Welcome Audio</h4>
              </div>
              <p className="text-steel-light text-sm mb-3">
                AI-generated welcome message (2 minutes)
              </p>
              <Button className="bg-construction hover:bg-construction-dark text-midnight font-oswald">
                Play Welcome Message
              </Button>
            </Card>

            {/* How Recovery Works Slides */}
            <Card className="bg-white/10 border-steel-dark p-4">
              <h4 className="font-oswald font-semibold text-white mb-3">How Recovery Works</h4>
              <div className="bg-steel-dark/50 rounded-lg p-4 mb-3">
                <p className="text-steel-light text-sm">
                  Swipe through 3 educational slides about the recovery process
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-construction rounded-full"></div>
                <div className="w-2 h-2 bg-steel-dark rounded-full"></div>
                <div className="w-2 h-2 bg-steel-dark rounded-full"></div>
              </div>
            </Card>

            {/* Text Prompt */}
            <Card className="bg-white/10 border-steel-dark p-4">
              <h4 className="font-oswald font-semibold text-white mb-3">Your Why</h4>
              <p className="text-steel-light text-sm mb-3">
                Complete this sentence: "I'm here because ______."
              </p>
              <textarea
                className="w-full bg-steel-dark text-white p-3 rounded-lg border border-steel resize-none"
                rows={3}
                placeholder="I'm here because..."
                onChange={(e) => handleResponseSave('why_here', e.target.value)}
              />
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Trigger Types Audio */}
            <Card className="bg-construction/10 border-construction/20 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Play className="text-construction" size={20} />
                <h4 className="font-oswald font-semibold text-white">Understanding Triggers</h4>
              </div>
              <p className="text-steel-light text-sm mb-3">
                AI-narrated walkthrough of trigger types (1 minute)
              </p>
              <Button className="bg-construction hover:bg-construction-dark text-midnight font-oswald">
                Play Audio Guide
              </Button>
            </Card>

            {/* Educational Carousel */}
            <Card className="bg-white/10 border-steel-dark p-4">
              <h4 className="font-oswald font-semibold text-white mb-3">Trigger Education</h4>
              <div className="space-y-3">
                <div className="bg-steel-dark/50 rounded-lg p-3">
                  <h5 className="text-construction font-medium">Internal Triggers</h5>
                  <p className="text-steel-light text-sm">Emotions, thoughts, physical sensations</p>
                </div>
                <div className="bg-steel-dark/50 rounded-lg p-3">
                  <h5 className="text-construction font-medium">External Triggers</h5>
                  <p className="text-steel-light text-sm">People, places, situations, objects</p>
                </div>
              </div>
            </Card>

            {/* Breathing Integration */}
            <Card className="bg-white/10 border-steel-dark p-4">
              <h4 className="font-oswald font-semibold text-white mb-3">Pause & Breathe</h4>
              <p className="text-steel-light text-sm mb-3">
                Interactive breathing exercise when triggered
              </p>
              <Button className="bg-construction hover:bg-construction-dark text-midnight font-oswald">
                Start Breathing Exercise
              </Button>
            </Card>

            {/* Top Triggers Form */}
            <Card className="bg-white/10 border-steel-dark p-4">
              <h4 className="font-oswald font-semibold text-white mb-3">Your Top Triggers</h4>
              <p className="text-steel-light text-sm mb-3">
                What are your top 2 triggers?
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full bg-steel-dark text-white p-3 rounded-lg border border-steel"
                  placeholder="Trigger #1"
                  onChange={(e) => handleResponseSave('trigger_1', e.target.value)}
                />
                <input
                  type="text"
                  className="w-full bg-steel-dark text-white p-3 rounded-lg border border-steel"
                  placeholder="Trigger #2"
                  onChange={(e) => handleResponseSave('trigger_2', e.target.value)}
                />
              </div>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <Card className="bg-white/10 border-steel-dark p-4">
              <h4 className="font-oswald font-semibold text-white mb-3">{dayData.title}</h4>
              <p className="text-steel-light">
                Day {day} content will be implemented with specific interactive elements.
              </p>
            </Card>
          </div>
        );
    }
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

        {/* Content */}
        <div className="p-6">
          <h3 className="font-oswald font-semibold text-white text-xl mb-4">
            {dayData.title}
          </h3>
          
          {renderDayContent()}
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
                onClick={handleComplete}
                className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Complete Day
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JourneyDayModal;
