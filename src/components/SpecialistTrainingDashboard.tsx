import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Trophy, Clock, Target, BookOpen, Play } from 'lucide-react';
import { useTrainingScenarios } from '@/hooks/useTrainingScenarios';
import { TrainingScenarioSelector } from './TrainingScenarioSelector';
import { MockChatTrainingEnvironment } from './MockChatTrainingEnvironment';

interface SpecialistTrainingDashboardProps {
  specialistId: string;
}

interface ActiveTraining {
  scenario: any;
  progressId: string;
}

const SpecialistTrainingDashboard = ({ specialistId }: SpecialistTrainingDashboardProps) => {
  const [activeTraining, setActiveTraining] = useState<ActiveTraining | null>(null);
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

  const completedCount = progress?.filter(p => p.status === 'completed').length || 0;
  const inProgressCount = progress?.filter(p => p.status === 'in_progress').length || 0;
  const totalScenarios = scenarios?.length || 0;
  const completionRate = totalScenarios > 0 ? (completedCount / totalScenarios) * 100 : 0;

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
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Training Scenarios
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

        <TabsContent value="scenarios" className="space-y-4">
          <TrainingScenarioSelector
            specialistId={specialistId}
            onScenarioStart={handleTrainingStart}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
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
                    No training progress yet. Start a scenario to begin!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Achievement badges based on progress */}
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">First Steps</h4>
                    <p className="text-sm text-muted-foreground">Complete your first training scenario</p>
                    <Badge variant={completedCount > 0 ? 'default' : 'outline'}>
                      {completedCount > 0 ? 'Unlocked' : 'Locked'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Getting Started</h4>
                    <p className="text-sm text-muted-foreground">Complete 3 training scenarios</p>
                    <Badge variant={completedCount >= 3 ? 'default' : 'outline'}>
                      {completedCount >= 3 ? 'Unlocked' : `${completedCount}/3`}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-green-500" />
                  <div>
                    <h4 className="font-medium">Dedicated Learner</h4>
                    <p className="text-sm text-muted-foreground">Complete 10 training scenarios</p>
                    <Badge variant={completedCount >= 10 ? 'default' : 'outline'}>
                      {completedCount >= 10 ? 'Unlocked' : `${completedCount}/10`}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-purple-500" />
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