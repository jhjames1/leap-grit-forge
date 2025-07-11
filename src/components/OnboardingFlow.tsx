import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Brain, Users, Target, Zap, TrendingUp, PenTool, Headphones, Goal, BarChart, Link, Sprout, CloudSun, Waves, Mountain, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

interface OnboardingFlowProps {
  onComplete: (userData: {
    firstName: string;
    focusAreas: string[];
    journeyStage: string;
    supportStyle: string;
  }) => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [journeyStage, setJourneyStage] = useState('');
  const [supportStyle, setSupportStyle] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const focusOptions = [
    { id: 'tough-moments', label: t('focus.toughMoments'), icon: Brain },
    { id: 'connections', label: t('focus.connections'), icon: Users },
    { id: 'routines', label: t('focus.routines'), icon: Target },
    { id: 'tools', label: t('focus.tools'), icon: Zap },
    { id: 'staying-track', label: t('focus.stayingTrack'), icon: TrendingUp }
  ];

  const stageOptions = [
    { id: 'starting', label: t('journeyStages.starting'), icon: Sprout },
    { id: 'few-weeks', label: t('journeyStages.fewWeeks'), icon: CloudSun },
    { id: 'few-months', label: t('journeyStages.fewMonths'), icon: Waves },
    { id: 'steady', label: t('journeyStages.steady'), icon: Mountain },
    { id: 'starting-again', label: t('journeyStages.startingAgain'), icon: RotateCcw }
  ];

  const supportOptions = [
    { id: 'reflection', label: t('support.reflection'), icon: PenTool },
    { id: 'audio', label: t('support.audio'), icon: Headphones },
    { id: 'goals', label: t('support.goals'), icon: Goal },
    { id: 'progress', label: t('support.progress'), icon: BarChart },
    { id: 'connection', label: t('support.connection'), icon: Link }
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
    
    // Load onboarding data and set it in userData
    const onboardingData = {
      firstName: firstName.trim() || '',
      focusAreas,
      journeyStage,
      supportStyle
    };
    
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    
    // Pass the full onboarding data including focus areas and journey stage
    setTimeout(() => {
      onComplete({
        ...onboardingData,
        focusAreas, // Ensure focusAreas is passed
        journeyStage // Ensure journeyStage is passed
      });
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-card p-6 max-w-sm w-full rounded-xl shadow-sm border-0 text-center animate-fade-in">
          <div className="mb-6">
            <div className="bg-primary p-2 rounded-lg mx-auto mb-4 w-fit">
              <CheckCircle2 className="text-primary-foreground" size={24} />
            </div>
            <h2 className="font-semibold text-[20px] text-card-foreground mb-2">
              {t('onboarding.success.title')}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="text-muted-foreground text-[16px]">
              {t('onboarding.success.subtitle')}
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
            <h2 className="font-semibold text-[20px] text-card-foreground mb-3 text-center">
              {t('onboarding.step1.title')}
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              {t('onboarding.step1.subtitle')}
            </p>
            
            <div className="space-y-3 mb-8">
              {focusOptions.map(option => {
                const Icon = option.icon;
                const isSelected = focusAreas.includes(option.id);
                
                return (
                  <Card
                    key={option.id}
                    onClick={() => handleFocusToggle(option.id)}
                    className={`p-2 cursor-pointer transition-all duration-200 border rounded-lg ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-card border-border hover:bg-accent hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary' : 'bg-muted'}`}>
                        <Icon 
                          className={`${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} 
                          size={20} 
                        />
                      </div>
                      <span className={`text-sm ${
                        isSelected ? 'text-card-foreground' : 'text-muted-foreground'
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
            <h2 className="font-semibold text-[20px] text-card-foreground mb-3 text-center">
              {t('onboarding.step2.title')}
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              {t('onboarding.step2.subtitle')}
            </p>
            
            <div className="space-y-3 mb-8">
              {stageOptions.map(option => {
                const Icon = option.icon;
                const isSelected = journeyStage === option.id;
                
                return (
                  <Card
                    key={option.id}
                    onClick={() => setJourneyStage(option.id)}
                    className={`p-2 cursor-pointer transition-all duration-200 border rounded-lg ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-card border-border hover:bg-accent hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary' : 'bg-muted'}`}>
                        <Icon 
                          className={`${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} 
                          size={20} 
                        />
                      </div>
                      <span className={`text-sm ${
                        isSelected ? 'text-card-foreground' : 'text-muted-foreground'
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
            <h2 className="font-semibold text-[20px] text-card-foreground mb-3 text-center">
              {t('onboarding.step3.title')}
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              {t('onboarding.step3.subtitle')}
            </p>
            
            <div className="space-y-3 mb-8">
              {supportOptions.map(option => {
                const Icon = option.icon;
                const isSelected = supportStyle === option.id;
                
                return (
                  <Card
                    key={option.id}
                    onClick={() => setSupportStyle(option.id)}
                    className={`p-2 cursor-pointer transition-all duration-200 border rounded-lg ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-card border-border hover:bg-accent hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary' : 'bg-muted'}`}>
                        <Icon 
                          className={`${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} 
                          size={20} 
                        />
                      </div>
                      <span className={`text-sm ${
                        isSelected ? 'text-card-foreground' : 'text-muted-foreground'
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
            <h2 className="font-semibold text-[20px] text-card-foreground mb-3 text-center">
              {t('onboarding.step4.title')}
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              {t('onboarding.step4.subtitle')}
            </p>
            
            <div className="mb-8">
              <Input
                type="text"
                placeholder={t('onboarding.step4.placeholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-4 text-[16px] border border-border rounded-lg bg-background focus:border-primary focus:outline-none"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="bg-card p-6 max-w-sm w-full rounded-xl shadow-sm border-0 animate-fade-in">
        {renderStep()}
        
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 text-[16px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 4 ? (
            <>
              {t('onboarding.button.letsLeap').split(' ').slice(0, -1).join(' ')}{' '}
              <span className="font-fjalla italic">
                {t('onboarding.button.letsLeap').split(' ').slice(-1)[0]}
              </span>
            </>
          ) : (
            t('onboarding.button.continue')
          )}
        </Button>
      </Card>
    </div>
  );
};

export default OnboardingFlow;