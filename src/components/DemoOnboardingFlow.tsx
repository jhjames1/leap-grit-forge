import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Brain, Users, Target, Zap, TrendingUp, PenTool, Headphones, Goal, BarChart, Link, Sprout, CloudSun, Waves, Mountain, RotateCcw, Flame, Play, Calendar, Bot, Moon, Sun, Globe } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {/* iPhone Mockup Frame */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-[375px] h-[812px] bg-black rounded-[40px] p-2 shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[154px] h-[32px] bg-black rounded-b-[16px] z-10"></div>
              
              {/* Content */}
              <div className="h-full bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-sm animate-fade-in">
                  <SplashScreen onComplete={handleSplashComplete} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show demo home page (step 5)
  if (currentStep === 5) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {/* iPhone Mockup Frame */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-[375px] h-[812px] bg-black rounded-[40px] p-2 shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[154px] h-[32px] bg-black rounded-b-[16px] z-10"></div>
              
              {/* Content */}
              <div className="h-full bg-background overflow-auto">
                <div className="pt-12 p-4 pb-24">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-6">
                      {/* Left column: Title and welcome text */}
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground mb-1 tracking-wide">
                          <span className="font-oswald font-extralight tracking-tight">DAILY</span><span className="font-fjalla font-extrabold italic">LEAP</span>
                        </h1>
                        <div className="mt-4"></div>
                        <p className="text-foreground font-oswald font-extralight tracking-wide mb-0 text-sm">
                          WELCOME, <span className="font-bold italic">{firstName ? firstName.toUpperCase() : 'DEMO USER'}</span>
                        </p>
                        <p className="text-muted-foreground text-xs">Your journey continues...</p>
                      </div>
                      
                      {/* Right column: Theme toggle, Language toggle, and Close button */}
                      <div className="flex flex-col items-end">
                        <div className="flex items-center space-x-2 mb-2">
                          {/* Theme Toggle */}
                          <Button variant="ghost" size="sm" className="p-1">
                            <Sun className="h-4 w-4" />
                          </Button>
                          {/* Language Toggle */}
                          <Button variant="ghost" size="sm" className="p-1">
                            <Globe className="h-4 w-4" />
                          </Button>
                          {/* Close button */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onClose}
                            className="text-xs"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Dashboard Cards */}
                  <div className="flex gap-2 mb-3">
                    <Card className="bg-card p-3 rounded-lg border-0 shadow-none transition-colors duration-300 w-[70%]">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-primary p-2 rounded-sm">
                          <Target className="text-primary-foreground" size={16} />
                        </div>
                        <h3 className="font-fjalla font-bold text-card-foreground text-xs uppercase tracking-wide">
                          TODAY'S MOTIVATION
                        </h3>
                      </div>
                      <p className="text-card-foreground text-xs italic leading-tight">"Every step forward is progress, no matter how small."</p>
                    </Card>

                    <Card className="bg-card p-3 rounded-lg border-0 shadow-none transition-colors duration-300 w-[30%]">
                      <div className="text-center">
                        <h3 className="font-fjalla font-bold text-card-foreground text-xs uppercase tracking-wide mb-1">
                          STREAK
                        </h3>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <div className="bg-primary p-2 rounded-sm">
                            <Flame className="text-primary-foreground" size={14} />
                          </div>
                          <div className="text-lg font-bold text-card-foreground">1</div>
                        </div>
                        <p className="text-muted-foreground text-xs lowercase italic">days</p>
                      </div>
                    </Card>
                  </div>

                  {/* Start Your Day Card */}
                  <Card className="bg-black/[7.5%] p-3 rounded-lg mb-3 border-0 shadow-none transition-colors duration-300">
                    <h3 className="font-fjalla font-bold text-card-foreground mb-2 tracking-wide text-xs">
                      START YOUR DAY
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 p-2 rounded-sm">
                        <Play className="text-black" size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-card-foreground font-source text-xs">
                          Day 1 - {focusAreas.length > 0 ? 'Building Your Foundation' : 'Welcome Journey'}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* The Foreman Card */}
                  <Card className="relative bg-card rounded-lg mb-3 border-0 shadow-none transition-colors duration-300 overflow-hidden">
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: 'url(/lovable-uploads/c61510da-8bef-4d57-8fba-f87d453bd59e.png)'
                      }}
                    />
                    
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/60" />
                    
                    {/* Content */}
                    <div className="relative z-10 p-3">
                      <div className="flex flex-col items-center text-center mb-3">
                        <div>
                          <h3 className="font-fjalla font-bold text-white text-lg tracking-wide">
                            THE FOREMAN
                          </h3>
                          <p className="text-white/80 text-xs font-source">Get immediate support when you need it</p>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-source font-bold py-2 rounded-lg tracking-wide transition-colors duration-300 flex items-center justify-center gap-2 text-xs"
                      >
                        <Bot size={16} />
                        TALK TO THE FOREMAN
                      </Button>
                    </div>
                  </Card>

                  {/* Calendar Card */}
                  <div className="flex justify-center">
                    <Card 
                      className="bg-card p-3 rounded-lg cursor-pointer hover:shadow-md transition-all duration-300 border-0 shadow-none w-40"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-primary p-2 rounded-lg">
                          <Calendar className="text-primary-foreground" size={16} />
                        </div>
                        <h3 className="font-fjalla font-bold text-card-foreground text-xs tracking-wide">CALENDAR</h3>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* iPhone Mockup Frame */}
      <div className="relative">
        {/* Phone Frame */}
        <div className="w-[375px] h-[812px] bg-black rounded-[40px] p-2 shadow-2xl">
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[154px] h-[32px] bg-black rounded-b-[16px] z-10"></div>
            
            {/* Content */}
            <div className="h-full bg-background flex items-center justify-center p-4">
              <Card className="bg-card p-6 max-w-sm w-full rounded-xl shadow-sm border-0 animate-fade-in relative">
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
        </div>
      </div>
    </div>
  );
};