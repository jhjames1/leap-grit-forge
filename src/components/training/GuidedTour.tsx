import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTraining } from '@/contexts/TrainingContext';

interface GuidedTourProps {
  tourId: string;
  steps: Array<{
    id: string;
    title: string;
    content: string;
    target?: string;
    action?: 'click' | 'input' | 'observe';
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function GuidedTour({ tourId, steps, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { endTour } = useTraining();

  const currentTourStep = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (currentTourStep?.target) {
      const element = document.querySelector(currentTourStep.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight overlay
        element.style.position = 'relative';
        element.style.zIndex = '1000';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        element.style.borderRadius = '4px';
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.style.position = '';
        highlightedElement.style.zIndex = '';
        highlightedElement.style.boxShadow = '';
        highlightedElement.style.borderRadius = '';
      }
    };
  }, [currentStep, currentTourStep?.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    endTour();
  };

  const handleSkip = () => {
    onSkip?.();
    endTour();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement || !tooltipRef.current) return { top: 50, left: 50 };
    
    const elementRect = highlightedElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const position = currentTourStep.position || 'bottom';
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = elementRect.top - tooltipRect.height - 10;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = elementRect.bottom + 10;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.right + 10;
        break;
    }
    
    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={handleSkip} />
      
      {/* Tooltip */}
      <Card 
        ref={tooltipRef}
        className="w-80 max-w-sm mx-4 relative z-[10000] shadow-xl"
        style={{
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm mb-4">{currentTourStep.content}</p>
          
          {currentTourStep.action && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Action: {currentTourStep.action === 'click' ? 'Click the highlighted element' : 
                         currentTourStep.action === 'input' ? 'Enter information in the highlighted field' : 
                         'Observe the highlighted element'}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                onClick={handleNext}
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                {currentStep !== steps.length - 1 && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}