import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Trophy, Clock, Target, BookOpen, Play, Shield, AlertTriangle, Users, Heart, Compass } from 'lucide-react';
import { useTrainingScenarios } from '@/hooks/useTrainingScenarios';
import { MockChatTrainingEnvironment } from './MockChatTrainingEnvironment';
import PeerSpecialistTrainingModules from './training/PeerSpecialistTrainingModules';

interface SpecialistTrainingDashboardProps {
  specialistId: string;
}

interface ActiveTraining {
  scenario: any;
  progressId: string;
}

const SpecialistTrainingDashboard = ({ specialistId }: SpecialistTrainingDashboardProps) => {
  const [activeTraining, setActiveTraining] = useState<ActiveTraining | null>(null);
  const [activeTab, setActiveTab] = useState('modules');
  const { scenarios, progress, summary, loading, error } = useTrainingScenarios(specialistId);

  const handleTrainingStart = (scenario: any, progressId?: string) => {
    setActiveTraining({ 
      scenario, 
      progressId: progressId || `temp-${Date.now()}` 
    });
  };

  const handleTrainingComplete = (results: any) => {
    setActiveTraining(null);
  };

  const handleTrainingExit = () => {
    setActiveTraining(null);
  };

  if (activeTraining) {
    return (
      <MockChatTrainingEnvironment
        scenario={activeTraining.scenario}
        progressId={activeTraining.progressId}
        specialistId={specialistId}
        onComplete={handleTrainingComplete}
        onExit={handleTrainingExit}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p className="font-medium">Failed to load training data</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate combined metrics from both module training and scenario training
  const moduleCompletedCount = 5; // We have 5 core modules - this would be dynamic in real implementation
  const scenarioCompletedCount = progress?.filter(p => p.status === 'completed').length || 0;
  const scenarioInProgressCount = progress?.filter(p => p.status === 'in_progress').length || 0;
  const totalScenarios = scenarios?.length || 0;
  
  const completedCount = moduleCompletedCount + scenarioCompletedCount;
  const inProgressCount = scenarioInProgressCount;
  const totalTrainingItems = 5 + totalScenarios; // 5 modules + scenarios
  const completionRate = totalTrainingItems > 0 ? (completedCount / totalTrainingItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Training Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
              </div>
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-4">
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <Trophy className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{summary?.average_score ? `${Math.round(summary.average_score)}%` : 'N/A'}</p>
              </div>
              <Target className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Core Training
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Practice Scenarios
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            My Progress
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <PeerSpecialistTrainingModules specialistId={specialistId} />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Practice Scenarios
              </CardTitle>
              <p className="text-muted-foreground">
                Apply your knowledge with realistic practice scenarios. Complete the Core Training modules first to unlock advanced scenarios.
              </p>
            </CardHeader>
            <CardContent>
              {scenarios && scenarios.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scenarios.map((scenario) => {
                    const scenarioProgress = progress?.find(p => p.scenario_id === scenario.id);
                    const isCompleted = scenarioProgress?.status === 'completed';
                    const isInProgress = scenarioProgress?.status === 'in_progress';

                    return (
                      <Card key={scenario.id} className={`${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{scenario.title}</CardTitle>
                            {isCompleted && <Trophy className="h-5 w-5 text-green-600" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {scenario.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {scenario.estimated_duration_minutes}m
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleTrainingStart(scenario, scenarioProgress?.id)}
                              variant={isCompleted ? "outline" : "default"}
                            >
                              {isInProgress ? (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  Continue
                                </>
                              ) : isCompleted ? (
                                'Practice Again'
                              ) : (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  Start
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No practice scenarios available yet.</p>
                  <p className="text-sm">Complete your core training modules to unlock scenarios.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4">
            {/* Core Training Modules Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Core Training Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: 'digital-ethics', title: 'Digital & Ethical Literacy', icon: Shield, color: 'text-blue-600' },
                    { id: 'safety-risk', title: 'Safety & Risk Management', icon: AlertTriangle, color: 'text-red-600' },
                    { id: 'role-scope', title: 'Role & Scope of Practice', icon: Target, color: 'text-green-600' },
                    { id: 'values-principles', title: 'Values & Principles', icon: Heart, color: 'text-purple-600' },
                    { id: 'mutual-support', title: 'Self-Help & Mutual Support', icon: Users, color: 'text-orange-600' }
                  ].map((module, index) => (
                    <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <module.icon className={`h-5 w-5 ${module.color}`} />
                        <div>
                          <h4 className="font-medium">{module.title}</h4>
                          <p className="text-sm text-muted-foreground">Core specialist training</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Module {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Practice Scenarios Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Practice Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress && progress.length > 0 ? (
                    progress.map((progressItem) => {
                      const scenario = scenarios?.find(s => s.id === progressItem.scenario_id);
                      if (!scenario) return null;

                      return (
                        <div key={progressItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{scenario.title}</h4>
                            <p className="text-sm text-muted-foreground">{scenario.category}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={
                              progressItem.status === 'completed' ? 'default' :
                              progressItem.status === 'in_progress' ? 'secondary' : 'outline'
                            }>
                              {progressItem.status.replace('_', ' ')}
                            </Badge>
                            {progressItem.score !== null && (
                              <span className="text-sm font-medium">{progressItem.score}%</span>
                            )}
                            {progressItem.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleTrainingStart(scenario, progressItem.id)}
                                className="gap-2"
                              >
                                <Play className="h-3 w-3" />
                                Continue
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No scenario progress yet.</p>
                      <p className="text-sm">Complete core modules to unlock practice scenarios.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Core Training Achievements */}
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Shield className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Core Foundation</h4>
                    <p className="text-sm text-muted-foreground">Complete all 5 core training modules</p>
                    <Badge variant="outline">
                      Progress: 0/5
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <h4 className="font-medium">Safety Expert</h4>
                    <p className="text-sm text-muted-foreground">Master safety and risk management</p>
                    <Badge variant="outline">
                      Locked
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Heart className="h-8 w-8 text-purple-500" />
                  <div>
                    <h4 className="font-medium">Values Champion</h4>
                    <p className="text-sm text-muted-foreground">Demonstrate deep understanding of peer support values</p>
                    <Badge variant="outline">
                      Locked
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">First Steps</h4>
                    <p className="text-sm text-muted-foreground">Complete your first training module</p>
                    <Badge variant="outline">
                      Locked
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <div>
                    <h4 className="font-medium">Practice Ready</h4>
                    <p className="text-sm text-muted-foreground">Complete 3 practice scenarios</p>
                    <Badge variant={scenarioCompletedCount >= 3 ? 'default' : 'outline'}>
                      {scenarioCompletedCount >= 3 ? 'Unlocked' : `${scenarioCompletedCount}/3`}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Compass className="h-8 w-8 text-indigo-500" />
                  <div>
                    <h4 className="font-medium">Excellence</h4>
                    <p className="text-sm text-muted-foreground">Achieve 90%+ average score</p>
                    <Badge variant={(summary?.average_score || 0) >= 90 ? 'default' : 'outline'}>
                      {(summary?.average_score || 0) >= 90 ? 'Unlocked' : `${Math.round(summary?.average_score || 0)}%`}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpecialistTrainingDashboard;