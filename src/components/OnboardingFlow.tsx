import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Brain, Users, Target, Zap, TrendingUp, PenTool, Headphones, Goal, BarChart, Link } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (userData: {
    firstName: string;
    focusAreas: string[];
    journeyStage: string;
    supportStyle: string;
  }) => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [journeyStage, setJourneyStage] = useState('');
  const [supportStyle, setSupportStyle] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const focusOptions = [
    { id: 'tough-moments', label: 'Managing tough moments', icon: Brain },
    { id: 'connections', label: 'Building stronger connections', icon: Users },
    { id: 'routines', label: 'Creating healthy routines', icon: Target },
    { id: 'tools', label: 'Finding tools that work', icon: Zap },
    { id: 'staying-track', label: 'Staying on track', icon: TrendingUp }
  ];

  const stageOptions = [
    { id: 'starting', label: 'Just starting out', emoji: '🌱' },
    { id: 'few-weeks', label: 'A few weeks in', emoji: '🌤️' },
    { id: 'few-months', label: 'A few months strong', emoji: '🌊' },
    { id: 'steady', label: 'Feeling steady, but staying sharp', emoji: '🏔' },
    { id: 'starting-again', label: 'Starting again after a pause', emoji: '🔁' }
  ];

  const supportOptions = [
    { id: 'reflection', label: 'Quiet reflection & journaling', icon: PenTool },
    { id: 'audio', label: 'Calming audio support', icon: Headphones },
    { id: 'goals', label: 'Simple daily goals', icon: Goal },
    { id: 'progress', label: 'Seeing your progress', icon: BarChart },
    { id: 'connection', label: 'Knowing someone\'s there', icon: Link }
  ];

  const handleFocusToggle = (focusId: string) => {
    setFocusAreas(prev => 
      prev.includes(focusId) 
        ? prev.filter(id => id !== focusId)
        : [...prev, focusId]
    );
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setShowSuccess(true);
    
    // Save onboarding data
    const onboardingData = {
      firstName: firstName.trim() || 'Friend',
      focusAreas,
      journeyStage,
      supportStyle
    };
    
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    
    // Show success screen briefly before completing
    setTimeout(() => {
      onComplete(onboardingData);
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return focusAreas.length > 0;
      case 2: return journeyStage !== '';
      case 3: return supportStyle !== '';
      case 4: return true; // Name is optional
      default: return false;
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <Card className="bg-white p-8 max-w-sm w-full rounded-xl shadow-sm border-0 text-center animate-fade-in">
          <div className="mb-6">
            <CheckCircle2 className="mx-auto text-primary mb-4" size={48} />
            <h2 className="font-semibold text-[20px] text-gray-900 mb-2">
              Welcome to LEAP{firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="text-gray-600 text-[16px]">
              Let's take it one day at a time.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2 className="font-semibold text-[20px] text-gray-900 mb-3 text-center">
              What brings you to LEAP today?
            </h2>
            <p className="text-gray-600 text-[16px] mb-6 text-center">
              Choose what you'd like to build strength around.
            </p>
            
            <div className="space-y-3 mb-8">
              {focusOptions.map(option => {
                const Icon = option.icon;
                const isSelected = focusAreas.includes(option.id);
                
                return (
                  <Card
                    key={option.id}
                    onClick={() => handleFocusToggle(option.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 border rounded-lg ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon 
                        className={`${isSelected ? 'text-primary' : 'text-gray-500'}`} 
                        size={20} 
                      />
                      <span className={`text-[16px] ${
                        isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h2 className="font-semibold text-[20px] text-gray-900 mb-3 text-center">
              Where are you in your journey?
            </h2>
            <p className="text-gray-600 text-[16px] mb-6 text-center">
              We'll personalize things based on where you are.
            </p>
            
            <div className="space-y-3 mb-8">
              {stageOptions.map(option => {
                const isSelected = journeyStage === option.id;
                
                return (
                  <Card
                    key={option.id}
                    onClick={() => setJourneyStage(option.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 border rounded-lg ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{option.emoji}</span>
                      <span className={`text-[16px] ${
                        isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="font-semibold text-[20px] text-gray-900 mb-3 text-center">
              What helps you feel focused?
            </h2>
            <p className="text-gray-600 text-[16px] mb-6 text-center">
              We'll adjust your daily support to match your style.
            </p>
            
            <div className="space-y-3 mb-8">
              {supportOptions.map(option => {
                const Icon = option.icon;
                const isSelected = supportStyle === option.id;
                
                return (
                  <Card
                    key={option.id}
                    onClick={() => setSupportStyle(option.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 border rounded-lg ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon 
                        className={`${isSelected ? 'text-primary' : 'text-gray-500'}`} 
                        size={20} 
                      />
                      <span className={`text-[16px] ${
                        isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 className="font-semibold text-[20px] text-gray-900 mb-3 text-center">
              What's your first name?
            </h2>
            <p className="text-gray-600 text-[16px] mb-6 text-center">
              (Optional, but helpful)
            </p>
            
            <div className="mb-8">
              <Input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-4 text-[16px] border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <Card className="bg-white p-8 max-w-sm w-full rounded-xl shadow-sm border-0 animate-fade-in">
        {renderStep()}
        
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full bg-[#FFCE00] hover:bg-[#E6B800] text-black font-bold py-4 text-[16px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 4 ? "Let's LEAP" : 'Continue'}
        </Button>
      </Card>
    </div>
  );
};

export default OnboardingFlow;