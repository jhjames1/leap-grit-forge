import React, { useState } from 'react';
import { 
  Book, 
  Play, 
  Award, 
  Clock, 
  CheckCircle, 
  Lock,
  Star,
  TrendingUp,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTraining } from '@/contexts/TrainingContext';
import { GuidedTour } from './GuidedTour';

export function TrainingDashboard() {
  const { 
    modules, 
    progress, 
    startModule, 
    startTour, 
    currentTour,
    toggleTrainingMode,
    isTrainingMode 
  } = useTraining();
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const totalModules = modules.length;
  const completedModules = progress.completedModules.length;
  const overallProgress = (completedModules / totalModules) * 100;

  const handleStartModule = (moduleId: string) => {
    startModule(moduleId);
    setSelectedModule(moduleId);
  };

  const handleStartQuickTour = () => {
    const quickTourSteps = [
      {
        id: 'dashboard',
        title: 'Welcome to Training',
        content: 'This is your training dashboard where you can access all learning modules.',
        target: '.training-dashboard'
      },
      {
        id: 'modules',
        title: 'Training Modules',
        content: 'Each module covers specific aspects of using the specialist portal.',
        target: '.training-modules'
      },
      {
        id: 'progress',
        title: 'Track Progress',
        content: 'Monitor your learning progress and earned badges here.',
        target: '.progress-section'
      }
    ];
    
    startTour('quick-tour');
  };

  const getBadgeCount = () => {
    return Math.floor(progress.totalScore / 100);
  };

  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case 'getting-started': return <Book className="h-5 w-5" />;
      case 'chat-management': return <User className="h-5 w-5" />;
      case 'calendar-scheduling': return <Calendar className="h-5 w-5" />;
      default: return <Book className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="training-dashboard p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Specialist Training Portal</h1>
          <p className="text-muted-foreground mt-1">
            Master the skills needed to be an effective peer specialist
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStartQuickTour}>
            <Play className="h-4 w-4 mr-2" />
            Quick Tour
          </Button>
          <Button 
            variant={isTrainingMode ? "default" : "outline"}
            onClick={toggleTrainingMode}
          >
            {isTrainingMode ? 'Exit Training Mode' : 'Enter Training Mode'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="scenarios">Practice Scenarios</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {/* Progress Overview */}
          <div className="progress-section grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedModules}/{totalModules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Badges Earned</p>
                    <p className="text-2xl font-bold">{getBadgeCount()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-2xl font-bold">{progress.totalScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Modules */}
          <div className="training-modules space-y-4">
            <h2 className="text-xl font-semibold">Training Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <Card key={module.id} className={module.completed ? 'border-green-200' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(module.id)}
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                      </div>
                      {module.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : !module.unlocked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : null}
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {module.duration} minutes
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {module.scenarios.map((scenario) => (
                          <Badge 
                            key={scenario.id}
                            variant="outline"
                            className={getDifficultyColor(scenario.difficulty)}
                          >
                            {scenario.difficulty}
                          </Badge>
                        ))}
                      </div>

                      {module.prerequisites && (
                        <div className="text-sm text-muted-foreground">
                          Prerequisites: {module.prerequisites.join(', ')}
                        </div>
                      )}
                      
                      <Button 
                        className="w-full"
                        onClick={() => handleStartModule(module.id)}
                        disabled={!module.unlocked}
                        variant={module.completed ? "outline" : "default"}
                      >
                        {module.completed ? 'Review' : module.unlocked ? 'Start Module' : 'Locked'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Track your journey through the training program</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h3 className="font-semibold mb-3">Completed Modules</h3>
                    <div className="space-y-2">
                      {modules.filter(m => m.completed).map((module) => (
                        <div key={module.id} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{module.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Badges Earned</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: getBadgeCount() }, (_, i) => (
                        <div key={i} className="flex flex-col items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <Award className="h-6 w-6 text-yellow-500" />
                          <span className="text-xs mt-1">Level {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Scenarios</CardTitle>
              <CardDescription>Hands-on practice with realistic situations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Practice scenarios will be available once you complete the basic training modules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Resources</CardTitle>
              <CardDescription>Additional materials and references</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Quick Reference Guides</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Chat Management Basics</li>
                    <li>• Crisis Response Protocol</li>
                    <li>• Calendar Scheduling Guide</li>
                    <li>• Emergency Procedures</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Video Tutorials</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Portal Navigation (5 min)</li>
                    <li>• Handling Difficult Conversations (15 min)</li>
                    <li>• Setting Up Your Schedule (8 min)</li>
                    <li>• Best Practices Overview (12 min)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guided Tour Component */}
      {currentTour === 'quick-tour' && (
        <GuidedTour
          tourId="quick-tour"
          steps={[
            {
              id: 'dashboard',
              title: 'Welcome to Training',
              content: 'This is your training dashboard where you can access all learning modules.',
              target: '.training-dashboard'
            },
            {
              id: 'modules',
              title: 'Training Modules',
              content: 'Each module covers specific aspects of using the specialist portal.',
              target: '.training-modules'
            },
            {
              id: 'progress',
              title: 'Track Progress',
              content: 'Monitor your learning progress and earned badges here.',
              target: '.progress-section'
            }
          ]}
        />
      )}
    </div>
  );
}