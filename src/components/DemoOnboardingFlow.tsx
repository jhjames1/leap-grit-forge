import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Users, Target, Brain, Heart } from 'lucide-react';

interface DemoOnboardingFlowProps {
  isVisible: boolean;
  onClose: () => void;
}

const focusAreas = [
  { id: 'addiction', label: 'Addiction Recovery', icon: Brain, color: 'text-primary' },
  { id: 'stress', label: 'Stress Management', icon: Heart, color: 'text-secondary' },
  { id: 'workplace', label: 'Workplace Wellness', icon: Users, color: 'text-accent' },
  { id: 'goals', label: 'Personal Goals', icon: Target, color: 'text-muted-foreground' }
];

export const DemoOnboardingFlow: React.FC<DemoOnboardingFlowProps> = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  if (!isVisible) return null;

  const handleAreaToggle = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleting(true);
      setTimeout(() => {
        onClose();
        setCurrentStep(1);
        setSelectedAreas([]);
        setFirstName('');
        setIsCompleting(false);
      }, 2000);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return firstName.length > 0;
    if (currentStep === 2) return selectedAreas.length > 0;
    return true;
  };

  const renderStep = () => {
    if (isCompleting) {
      return (
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-xl font-semibold">Welcome to LEAP, {firstName}!</h3>
          <p className="text-muted-foreground">Your personalized journey is being created...</p>
          <Progress value={100} className="w-full" />
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Let's get started</h3>
            <p className="text-muted-foreground">What should we call you?</p>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What areas would you like to focus on?</h3>
            <p className="text-muted-foreground">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {focusAreas.map((area) => (
                <Card 
                  key={area.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAreas.includes(area.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleAreaToggle(area.id)}
                >
                  <CardContent className="p-4 text-center">
                    <area.icon className={`w-8 h-8 mx-auto mb-2 ${area.color}`} />
                    <p className="text-sm font-medium">{area.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Perfect! Here's your personalized plan</h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Your Focus Areas:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAreas.map(areaId => {
                      const area = focusAreas.find(a => a.id === areaId);
                      return (
                        <span key={areaId} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          {area?.label}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Your Peer Specialist:</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on your preferences, we've matched you with Sarah, who specializes in {selectedAreas[0] === 'addiction' ? 'addiction recovery' : 'wellness coaching'}.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>LEAP Onboarding Demo</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
          <CardDescription>
            Step {currentStep} of 3
          </CardDescription>
          <Progress value={(currentStep / 3) * 100} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}
          {!isCompleting && (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed()}
              className="w-full"
            >
              {currentStep === 3 ? 'Complete Setup' : 'Continue'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};