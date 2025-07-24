
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Settings, Zap, RotateCcw, BookOpen, Play } from 'lucide-react';
import { testingMode, TestingModeConfig } from '@/utils/testingMode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserData } from '@/hooks/useUserData';
import { TrainingScenarioSelector } from './TrainingScenarioSelector';
import { MockChatTrainingEnvironment } from './MockChatTrainingEnvironment';
import { TrainingScenario, useTrainingScenarios } from '@/hooks/useTrainingScenarios';

interface TestingModeControlsProps {
  onResetProgress?: () => void;
  onCompleteDay?: (day: number) => void;
  onSkipToDay?: (day: number) => void;
  currentDay?: number;
  maxDays?: number;
  specialistId?: string; // For training scenarios
}

export function TestingModeControls({
  onResetProgress,
  onCompleteDay,
  onSkipToDay,
  currentDay = 1,
  maxDays = 90,
  specialistId
}: TestingModeControlsProps) {
  const [config, setConfig] = useState<TestingModeConfig>(testingMode.getConfig());
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('testing');
  const [activeTrainingScenario, setActiveTrainingScenario] = useState<{
    scenario: TrainingScenario;
    progressId: string;
  } | null>(null);
  
  const { userData, updateUserData } = useUserData();
  const { completeScenario } = useTrainingScenarios(specialistId);

  useEffect(() => {
    const updateConfig = () => {
      setConfig(testingMode.getConfig());
    };
    
    updateConfig();
    
    // Check for testing mode changes
    const interval = setInterval(updateConfig, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetProgress = () => {
    if (userData) {
      const resetProgress = {
        completedDays: [],
        currentWeek: 1,
        badges: [],
        completionDates: {}
      };
      
      updateUserData({ 
        journeyProgress: resetProgress,
        journeyResponses: {}
      });
      
      onResetProgress?.();
    }
  };

  const handleCompleteCurrentDay = () => {
    if (userData && currentDay) {
      const currentProgress = userData.journeyProgress || {
        completedDays: [],
        currentWeek: 1,
        badges: [],
        completionDates: {}
      };
      
      if (!currentProgress.completedDays.includes(currentDay)) {
        const updatedProgress = {
          ...currentProgress,
          completedDays: [...currentProgress.completedDays, currentDay].sort((a, b) => a - b),
          completionDates: {
            ...currentProgress.completionDates,
            [currentDay]: new Date().toISOString()
          }
        };
        
        updateUserData({ journeyProgress: updatedProgress });
        onCompleteDay?.(currentDay);
      }
    }
  };

  const handleSkipToDay = (targetDay: number) => {
    if (userData) {
      const currentProgress = userData.journeyProgress || {
        completedDays: [],
        currentWeek: 1,
        badges: [],
        completionDates: {}
      };
      
      // Complete all days up to the target day
      const completedDays = [];
      const completionDates: Record<number, string> = { ...currentProgress.completionDates };
      
      for (let i = 1; i < targetDay; i++) {
        if (!currentProgress.completedDays.includes(i)) {
          completedDays.push(i);
          completionDates[i] = new Date().toISOString();
        }
      }
      
      const updatedProgress = {
        ...currentProgress,
        completedDays: [...currentProgress.completedDays, ...completedDays].sort((a, b) => a - b),
        completionDates
      };
      
      updateUserData({ journeyProgress: updatedProgress });
      onSkipToDay?.(targetDay);
    }
  };

  const handleTrainingScenarioStart = (scenario: TrainingScenario, progressId: string) => {
    setActiveTrainingScenario({ scenario, progressId });
    setActiveTab('training-active');
  };

  const handleTrainingComplete = async (results: any) => {
    if (activeTrainingScenario && specialistId) {
      try {
        await completeScenario(
          activeTrainingScenario.progressId, 
          results.score || 0,
          results.feedback || {},
          results.timeSpentMinutes || 0
        );
      } catch (error) {
        console.error('Failed to complete training scenario:', error);
      }
    }
    setActiveTrainingScenario(null);
    setActiveTab('training');
  };

  const handleTrainingExit = () => {
    setActiveTrainingScenario(null);
    setActiveTab('training');
  };

  if (!testingMode.isEnabled()) {
    return (
      <Card className="border-dashed border-muted mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Testing mode disabled</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testingMode.enableTestingMode()}
            >
              Enable Testing Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning bg-warning/5 mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            <CardTitle className="text-sm">Development Tools</CardTitle>
            <Badge variant="secondary" className="text-xs">DEV</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? 'Hide' : 'Show'}
          </Button>
        </div>
        <CardDescription className="text-xs">
          Development testing controls and training scenarios
        </CardDescription>
      </CardHeader>

      {isVisible && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="testing">Testing Mode</TabsTrigger>
              <TabsTrigger value="training">Training Scenarios</TabsTrigger>
              <TabsTrigger value="training-active" disabled={!activeTrainingScenario}>
                Active Training
              </TabsTrigger>
            </TabsList>

            <TabsContent value="testing" className="mt-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Testing mode is active. All journey restrictions are bypassed.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Testing Mode Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="testing-enabled" className="text-sm">
                    Testing Mode
                  </Label>
                  <Switch
                    id="testing-enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        testingMode.enableTestingMode();
                      } else {
                        testingMode.disableTestingMode();
                      }
                    }}
                  />
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Actions</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCompleteCurrentDay}
                    >
                      Complete Day {currentDay}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkipToDay(7)}
                    >
                      Skip to Day 7
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkipToDay(14)}
                    >
                      Skip to Day 14
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Progress Reset */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Progress Control</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetProgress}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Progress
                  </Button>
                </div>

                <Separator />

                {/* Configuration */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Configuration</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bypass-time" className="text-xs">
                      Bypass Time Restrictions
                    </Label>
                    <Switch
                      id="bypass-time"
                      checked={config.bypassTimeRestrictions}
                      onCheckedChange={(checked) => {
                        testingMode.updateConfig({ bypassTimeRestrictions: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="unlock-all" className="text-xs">
                      Unlock All Days
                    </Label>
                    <Switch
                      id="unlock-all"
                      checked={config.unlockAllDays}
                      onCheckedChange={(checked) => {
                        testingMode.updateConfig({ unlockAllDays: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="skip-week1" className="text-xs">
                      Skip Week 1 Requirements
                    </Label>
                    <Switch
                      id="skip-week1"
                      checked={config.skipWeek1Requirements}
                      onCheckedChange={(checked) => {
                        testingMode.updateConfig({ skipWeek1Requirements: checked });
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="text-xs text-muted-foreground">
                  Current Day: {currentDay} / {maxDays}
                  <br />
                  Completed Days: {userData?.journeyProgress?.completedDays?.length || 0}
                  <br />
                  User Data: {userData ? 'Loaded' : 'Missing'}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="training" className="mt-4">
              {specialistId ? (
                <TrainingScenarioSelector
                  specialistId={specialistId}
                  onScenarioStart={handleTrainingScenarioStart}
                />
              ) : (
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    Training scenarios are available for specialists only. Please log in as a specialist to access training features.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="training-active" className="mt-4">
              {activeTrainingScenario && specialistId ? (
                <MockChatTrainingEnvironment
                  scenario={activeTrainingScenario.scenario}
                  progressId={activeTrainingScenario.progressId}
                  specialistId={specialistId}
                  onComplete={handleTrainingComplete}
                  onExit={handleTrainingExit}
                />
              ) : (
                <Alert>
                  <Play className="h-4 w-4" />
                  <AlertDescription>
                    No active training scenario. Please select a scenario from the Training Scenarios tab.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};
