import React, { useState } from 'react';
import { 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Users, 
  MessageSquare, 
  Calendar,
  AlertTriangle,
  BookOpen,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { testingMode } from '@/utils/testingMode';
import { useTraining } from '@/contexts/TrainingContext';

interface TrainingScenarioProps {
  id: string;
  title: string;
  description: string;
  type: 'chat' | 'calendar' | 'crisis' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  onStart: () => void;
}

function TrainingScenario({ id, title, description, type, difficulty, duration, onStart }: TrainingScenarioProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'crisis': return <AlertTriangle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge className={getDifficultyColor()}>
            {difficulty}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Duration: {duration} minutes
          </div>
          <Button onClick={onStart} size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnhancedTestingControls() {
  const [config, setConfig] = useState(testingMode.getConfig());
  const [isScenarioActive, setIsScenarioActive] = useState(false);
  const { toggleTrainingMode, isTrainingMode } = useTraining();

  const handleToggleTestingMode = () => {
    testingMode.toggleTestingMode();
    setConfig(testingMode.getConfig());
  };

  const handleConfigChange = (key: string, value: boolean) => {
    testingMode.updateConfig({ [key]: value });
    setConfig(testingMode.getConfig());
  };

  const handleStartScenario = (scenarioId: string) => {
    setIsScenarioActive(true);
    // In a real implementation, this would start the specific scenario
    console.log(`Starting scenario: ${scenarioId}`);
  };

  const trainingScenarios = [
    {
      id: 'basic-chat',
      title: 'Basic Chat Handling',
      description: 'Practice responding to routine peer conversations',
      type: 'chat' as const,
      difficulty: 'beginner' as const,
      duration: 10
    },
    {
      id: 'crisis-response',
      title: 'Crisis Situation Response',
      description: 'Learn to handle emergency situations with proper protocols',
      type: 'crisis' as const,
      difficulty: 'advanced' as const,
      duration: 20
    },
    {
      id: 'calendar-management',
      title: 'Schedule Management',
      description: 'Master calendar and appointment scheduling',
      type: 'calendar' as const,
      difficulty: 'intermediate' as const,
      duration: 15
    },
    {
      id: 'difficult-conversation',
      title: 'Difficult Conversations',
      description: 'Navigate challenging discussions with peers',
      type: 'chat' as const,
      difficulty: 'advanced' as const,
      duration: 25
    },
    {
      id: 'multi-peer-session',
      title: 'Group Session Management',
      description: 'Handle multiple peers in group settings',
      type: 'general' as const,
      difficulty: 'intermediate' as const,
      duration: 30
    },
    {
      id: 'documentation',
      title: 'Session Documentation',
      description: 'Learn proper documentation and reporting',
      type: 'general' as const,
      difficulty: 'beginner' as const,
      duration: 12
    }
  ];

  if (!testingMode.isEnabled() && !isTrainingMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Training & Testing Mode
          </CardTitle>
          <CardDescription>
            Enable training mode to access practice scenarios and testing tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleToggleTestingMode} variant="outline">
              Enable Testing Mode
            </Button>
            <Button onClick={toggleTrainingMode}>
              Enter Training Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Training & Testing Controls
          </CardTitle>
          <CardDescription>
            Advanced tools for training and testing specialist portal functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="testing-mode">Testing Mode</Label>
                <Switch 
                  id="testing-mode"
                  checked={config.enabled}
                  onCheckedChange={handleToggleTestingMode}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="training-mode">Training Mode</Label>
                <Switch 
                  id="training-mode"
                  checked={isTrainingMode}
                  onCheckedChange={toggleTrainingMode}
                />
              </div>
            </div>
            <Badge variant={config.enabled || isTrainingMode ? "default" : "secondary"}>
              {config.enabled || isTrainingMode ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios">Training Scenarios</TabsTrigger>
          <TabsTrigger value="simulation">Data Simulation</TabsTrigger>
          <TabsTrigger value="testing">Testing Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Practice Scenarios</CardTitle>
              <CardDescription>
                Realistic training scenarios to practice specialist skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainingScenarios.map((scenario) => (
                  <TrainingScenario
                    key={scenario.id}
                    {...scenario}
                    onStart={() => handleStartScenario(scenario.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Simulation Controls</CardTitle>
              <CardDescription>
                Simulate various data states for testing purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Time & Progress Controls</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bypass-time">Bypass Time Restrictions</Label>
                      <Switch 
                        id="bypass-time"
                        checked={config.bypassTimeRestrictions}
                        onCheckedChange={(checked) => handleConfigChange('bypassTimeRestrictions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="unlock-days">Unlock All Days</Label>
                      <Switch 
                        id="unlock-days"
                        checked={config.unlockAllDays}
                        onCheckedChange={(checked) => handleConfigChange('unlockAllDays', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skip-week1">Skip Week 1 Requirements</Label>
                      <Switch 
                        id="skip-week1"
                        checked={config.skipWeek1Requirements}
                        onCheckedChange={(checked) => handleConfigChange('skipWeek1Requirements', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Simulation Actions</Label>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Simulate Active Peers
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Generate Test Messages
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Test Appointments
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Tools</CardTitle>
              <CardDescription>
                Advanced testing and debugging utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Progress Management</Label>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Progress
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Complete Current Day
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Skip to Specific Day
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Connection Testing</Label>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Test Real-time Connection
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Simulate Connection Issues
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Test Offline Mode
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Label>Emergency Scenarios</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-left">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Crisis Response Training
                  </Button>
                  <Button variant="outline" size="sm" className="text-left">
                    <Shield className="h-4 w-4 mr-2 text-blue-500" />
                    Security Protocol Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}