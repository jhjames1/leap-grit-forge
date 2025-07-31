import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Brain, Users, Target, Zap, TrendingUp, PenTool, Headphones, Goal, BarChart, Link, Sprout, CloudSun, Waves, Mountain, RotateCcw, Flame, Play } from 'lucide-react';
import SplashScreen from './SplashScreen';

interface DemoOnboardingFlowProps {
  isVisible: boolean;
  onClose: () => void;
}

const focusOptions = [
  { id: 'tough-moments', label: 'Navigating tough moments', icon: Brain },
  { id: 'connections', label: 'Building meaningful connections', icon: Users },
  { id: 'routines', label: 'Creating healthy routines', icon: Target },
  { id: 'tools', label: 'Learning coping tools', icon: Zap },
  { id: 'staying-track', label: 'Staying on track', icon: TrendingUp }
];

const stageOptions = [
  { id: 'starting', label: 'Just starting my journey', icon: Sprout },
  { id: 'few-weeks', label: 'A few weeks in', icon: CloudSun },
  { id: 'few-months', label: 'A few months in', icon: Waves },
  { id: 'steady', label: 'Steady for a while', icon: Mountain },
  { id: 'starting-again', label: 'Starting again', icon: RotateCcw }
];

const supportOptions = [
  { id: 'reflection', label: 'Self-reflection and journaling', icon: PenTool },
  { id: 'audio', label: 'Audio content and meditation', icon: Headphones },
  { id: 'goals', label: 'Goal setting and planning', icon: Goal },
  { id: 'progress', label: 'Progress tracking', icon: BarChart },
  { id: 'connection', label: 'Peer connection and support', icon: Link }
];

export const DemoOnboardingFlow: React.FC<DemoOnboardingFlowProps> = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0); // Start with splash screen (step 0)
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [journeyStage, setJourneyStage] = useState('');
  const [supportStyle, setSupportStyle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  if (!isVisible) return null;

  const handleSplashComplete = () => {
    setCurrentStep(1); // Move to first onboarding step
  };

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
      setIsCompleting(true);
      setTimeout(() => {
        setCurrentStep(5); // Move to demo home page
        setIsCompleting(false);
      }, 2000);
    }
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

  const renderStep = () => {
    if (isCompleting) {
      return (
        <div className="text-center space-y-4">
          <div className="bg-primary p-2 rounded-lg mx-auto mb-4 w-fit">
            <CheckCircle2 className="text-primary-foreground" size={24} />
          </div>
          <h2 className="font-semibold text-[20px] text-card-foreground mb-2">
            Welcome to LEAP{firstName ? `, ${firstName}` : ''}!
          </h2>
          <p className="text-muted-foreground text-[16px]">
            Your personalized journey is being created...
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <>
            <h2 className="font-semibold text-[20px] text-card-foreground mb-3 text-center">
              What would you like help with?
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              Select all that apply
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
              Where are you in your journey?
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              This helps us personalize your experience
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
              How do you like to be supported?
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              Choose your preferred approach
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
              Help us personalize your experience
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6 text-center">
              This information is optional
            </p>
            
            <div className="space-y-6 mb-8">
              <div>
                <Input
                  type="text"
                  placeholder="What should we call you?"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-4 text-[16px] border border-border rounded-lg bg-background focus:border-primary focus:outline-none"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-card-foreground mb-3 block">
                  Gender (Optional)
                </Label>
                <RadioGroup value={gender} onValueChange={setGender} className="flex justify-center space-x-8">
                  <div className="flex flex-col items-center space-y-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="text-sm cursor-pointer">Male</Label>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="text-sm cursor-pointer">Female</Label>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="text-sm cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Show splash screen first (step 0)
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 z-50">
        <SplashScreen onComplete={handleSplashComplete} />
      </div>
    );
  }

  // Show demo home page (step 5)
  if (currentStep === 5) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="min-h-screen bg-background">
          <div className="p-4 pb-24">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-6">
                {/* Left column: Title and welcome text */}
                <div className="flex-1">
                  <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                    <span className="font-oswald font-extralight tracking-tight">DAILY</span><span className="font-fjalla font-extrabold italic">LEAP</span>
                  </h1>
                  <div className="mt-8"></div>
                  <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
                    WELCOME, <span className="font-bold italic">{firstName ? firstName.toUpperCase() : 'DEMO USER'}</span>
                  </p>
                  <p className="text-muted-foreground text-sm">Your journey continues...</p>
                </div>
                
                {/* Right column: Close button */}
                <div className="flex flex-col items-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="mb-4"
                  >
                    × Close Demo
                  </Button>
                </div>
              </div>
            </div>

            {/* Demo Complete Message */}
            <Card className="bg-primary/10 border-primary/20 p-6 rounded-lg mb-4">
              <div className="text-center space-y-4">
                <CheckCircle2 className="text-primary mx-auto" size={32} />
                <h2 className="font-semibold text-xl text-card-foreground">
                  Demo Complete!
                </h2>
                <p className="text-muted-foreground">
                  This is what users see after completing onboarding. The actual app includes personalized daily activities, peer chat, progress tracking, and more.
                </p>
                <Button 
                  onClick={onClose}
                  className="mt-4"
                >
                  Back to Demo Overview
                </Button>
              </div>
            </Card>

            {/* Sample Dashboard Cards */}
            <div className="flex gap-4 mb-4">
              <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[70%]">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-primary p-3 rounded-sm">
                    <Target className="text-primary-foreground" size={20} />
                  </div>
                  <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                    TODAY'S MOTIVATION
                  </h3>
                </div>
                <p className="text-card-foreground text-sm italic leading-tight">"Every step forward is progress, no matter how small."</p>
              </Card>

              <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[30%]">
                <div className="text-center">
                  <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide mb-2">
                    STREAK
                  </h3>
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="bg-primary p-3 rounded-sm">
                      <Flame className="text-primary-foreground" size={20} />
                    </div>
                    <div className="text-[28px] font-bold text-card-foreground">1</div>
                  </div>
                  <p className="text-muted-foreground text-xs lowercase italic">days</p>
                </div>
              </Card>
            </div>

            {/* Start Your Day Card */}
            <Card className="bg-black/[7.5%] p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
              <h3 className="font-fjalla font-bold text-card-foreground mb-2 tracking-wide">
                START YOUR DAY
              </h3>
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-400 p-3 rounded-sm">
                  <Play className="text-black" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-card-foreground font-source text-sm">
                    Day 1 - {focusAreas.length > 0 ? 'Building Your Foundation' : 'Welcome Journey'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background min-h-screen flex items-center justify-center p-4 w-full max-w-md mx-auto rounded-lg">
        <Card className="bg-card p-6 max-w-sm w-full rounded-xl shadow-sm border-0 animate-fade-in">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
          
          {renderStep()}
          
          {!isCompleting && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 text-[16px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 4 ? (
                <>
                  Let's <span className="font-fjalla italic">LEAP</span>
                </>
              ) : (
                'Continue'
              )}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};