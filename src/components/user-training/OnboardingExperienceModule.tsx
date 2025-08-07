import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Brain, Users, Target, Zap, TrendingUp, Sprout, CloudSun, Waves, Mountain, RotateCcw, PenTool, Headphones, Goal, BarChart, Link } from 'lucide-react';

interface OnboardingExperienceModuleProps {
  onComplete: () => void;
}

const OnboardingExperienceModule = ({ onComplete }: OnboardingExperienceModuleProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedSupport, setSelectedSupport] = useState('');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('');

  const steps = [
    {
      title: "Step 1: Focus Areas",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">What would you like to focus on?</h2>
            <p className="text-muted-foreground text-sm">
              Select all areas that you'd like to work on
            </p>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 'tough-moments', label: 'Managing tough moments', icon: Brain },
              { id: 'connections', label: 'Building connections', icon: Users },
              { id: 'routines', label: 'Creating healthy routines', icon: Target },
              { id: 'tools', label: 'Learning coping tools', icon: Zap },
              { id: 'staying-track', label: 'Staying on track', icon: TrendingUp }
            ].map(option => {
              const Icon = option.icon;
              const isSelected = selectedFocus.includes(option.id);
              
              return (
                <Card
                  key={option.id}
                  onClick={() => {
                    setSelectedFocus(prev => 
                      prev.includes(option.id) 
                        ? prev.filter(id => id !== option.id)
                        : [...prev, option.id]
                    );
                  }}
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
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Training Note:</strong> This is the actual first step in LEAP onboarding. Focus areas determine the user's personalized journey content.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Journey Stage",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Where are you in your journey?</h2>
            <p className="text-muted-foreground text-sm">
              This helps us tailor your experience
            </p>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 'starting', label: 'Just starting out', icon: Sprout },
              { id: 'few-weeks', label: 'A few weeks in', icon: CloudSun },
              { id: 'few-months', label: 'A few months in', icon: Waves },
              { id: 'steady', label: 'Feeling steady', icon: Mountain },
              { id: 'starting-again', label: 'Starting again', icon: RotateCcw }
            ].map(option => {
              const Icon = option.icon;
              const isSelected = selectedStage === option.id;
              
              return (
                <Card
                  key={option.id}
                  onClick={() => setSelectedStage(option.id)}
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
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> Journey stage affects the pace and type of content users receive in their recovery plan.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Support Style",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">How do you like to be supported?</h2>
            <p className="text-muted-foreground text-sm">
              Select the approach that resonates with you
            </p>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 'reflection', label: 'Written reflection and journaling', icon: PenTool },
              { id: 'audio', label: 'Audio exercises and meditations', icon: Headphones },
              { id: 'goals', label: 'Goal setting and achievement tracking', icon: Goal },
              { id: 'progress', label: 'Data and progress visualization', icon: BarChart },
              { id: 'connection', label: 'Social connection and community', icon: Link }
            ].map(option => {
              const Icon = option.icon;
              const isSelected = selectedSupport === option.id;
              
              return (
                <Card
                  key={option.id}
                  onClick={() => setSelectedSupport(option.id)}
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
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Training Note:</strong> Support style preferences help customize the delivery of daily content and exercises.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Step 4: Personal Info",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-3">Tell us a bit about yourself</h2>
            <p className="text-muted-foreground text-sm">
              This information is optional but helps personalize your experience
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <Input
                type="text"
                placeholder="What should we call you? (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-4 text-base border border-border rounded-lg bg-background"
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
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Training Note:</strong> Personal information is completely optional. The name field helps make the app feel more personal and welcoming.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Welcome to LEAP!",
      content: (
        <div className="text-center space-y-6">
          <div className="mb-8">
            <div className="bg-primary p-3 rounded-lg mx-auto mb-4 w-fit">
              <Target className="text-primary-foreground" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-3">
              You're all set{firstName ? `, ${firstName}` : ''}!
            </h2>
            <p className="text-muted-foreground text-sm">
              Your personalized recovery journey starts now
            </p>
          </div>
          
          {selectedFocus.length > 0 && (
            <Card className="p-4 bg-primary/10">
              <h3 className="text-sm font-semibold mb-3">Your LEAP Setup:</h3>
              <div className="text-left space-y-2 text-sm">
                <div><strong>Focus Areas:</strong> {selectedFocus.join(', ')}</div>
                {selectedStage && <div><strong>Journey Stage:</strong> {selectedStage}</div>}
                {selectedSupport && <div><strong>Support Style:</strong> {selectedSupport}</div>}
                {firstName && <div><strong>Name:</strong> {firstName}</div>}
              </div>
            </Card>
          )}
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Training Note:</strong> This completion screen shows users their choices and creates excitement for starting their journey.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedFocus.length > 0;
      case 1: return selectedStage !== '';
      case 2: return selectedSupport !== '';
      case 3: return true; // Name and gender are optional
      case 4: return true; // Success screen
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg font-bold">{steps[currentStep].title}</h1>
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px] flex items-center"
          >
            {steps[currentStep].content}
          </motion.div>

          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Let's <span className="font-fjalla italic">LEAP</span>
                </>
              ) : (
                'Continue'
              )}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingExperienceModule;