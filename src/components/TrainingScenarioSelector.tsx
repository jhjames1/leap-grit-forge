import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Star, 
  AlertTriangle, 
  MessageCircle, 
  CheckCircle,
  Lock,
  Play
} from 'lucide-react';
import { useTrainingScenarios, TrainingScenario } from '@/hooks/useTrainingScenarios';

interface TrainingScenarioSelectorProps {
  specialistId: string;
  onScenarioStart: (scenario: TrainingScenario, progressId?: string) => void;
}

const categoryIcons = {
  onboarding: BookOpen,
  crisis: AlertTriangle,
  difficult: MessageCircle,
  routine: CheckCircle,
  general: Star
};

const categoryColors = {
  onboarding: 'bg-blue-500',
  crisis: 'bg-red-500',
  difficult: 'bg-orange-500',
  routine: 'bg-green-500',
  general: 'bg-purple-500'
};

const difficultyLabels = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Intermediate', 
  4: 'Advanced',
  5: 'Expert'
};

export const TrainingScenarioSelector: React.FC<TrainingScenarioSelectorProps> = ({
  specialistId,
  onScenarioStart
}) => {
  const { 
    scenarios, 
    progress, 
    summary, 
    loading, 
    error,
    startScenario,
    getScenariosByCategory,
    getScenarioProgress,
    isScenarioAvailable
  } = useTrainingScenarios(specialistId);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['onboarding', 'routine', 'difficult', 'crisis'];

  const handleStartScenario = async (scenario: TrainingScenario) => {
    // Check if already in progress
    const inProgressItem = getScenarioProgress(scenario.id).find(p => p.status === 'in_progress');
    
    if (inProgressItem) {
      onScenarioStart(scenario, inProgressItem.id);
    } else {
      const success = await startScenario(scenario.id);
      if (success) {
        // Get the newly created progress item
        const newProgress = getScenarioProgress(scenario.id).find(p => p.status === 'in_progress');
        onScenarioStart(scenario, newProgress?.id);
      }
    }
  };

  const getScenarioStatus = (scenario: TrainingScenario) => {
    const scenarioProgress = getScenarioProgress(scenario.id);
    const completed = scenarioProgress.find(p => p.status === 'completed');
    const inProgress = scenarioProgress.find(p => p.status === 'in_progress');
    
    if (inProgress) return 'in_progress';
    if (completed) return 'completed';
    return 'not_started';
  };

  const renderScenarioCard = (scenario: TrainingScenario) => {
    const status = getScenarioStatus(scenario);
    const available = isScenarioAvailable(scenario);
    const IconComponent = categoryIcons[scenario.category];
    const scenarioProgress = getScenarioProgress(scenario.id);
    const bestScore = Math.max(...scenarioProgress.filter(p => p.score).map(p => p.score!), 0);

    return (
      <Card key={scenario.id} className={`relative ${!available ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${categoryColors[scenario.category]} text-white`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{scenario.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {scenario.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {difficultyLabels[scenario.difficulty_level]}
                  </Badge>
                </div>
              </div>
            </div>
            {status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {status === 'in_progress' && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-blue-600">In Progress</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-sm mb-4">
            {scenario.description}
          </CardDescription>
          
          <div className="space-y-3">
            {/* Learning Objectives */}
            <div>
              <h4 className="text-sm font-medium mb-2">Learning Objectives:</h4>
              <div className="flex flex-wrap gap-1">
                {scenario.learning_objectives.slice(0, 3).map((objective, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {objective}
                  </Badge>
                ))}
                {scenario.learning_objectives.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{scenario.learning_objectives.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {scenario.estimated_duration_minutes} min
              </div>
              {bestScore > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Best: {bestScore}%
                </div>
              )}
            </div>

            {/* Prerequisites */}
            {scenario.prerequisites && scenario.prerequisites.length > 0 && (
              <div className="text-xs">
                <span className="text-muted-foreground">Prerequisites: </span>
                {scenario.prerequisites.join(', ')}
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={() => handleStartScenario(scenario)}
              disabled={!available || loading}
              className="w-full"
              variant={status === 'completed' ? 'outline' : 'default'}
            >
              {!available ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Locked
                </>
              ) : status === 'in_progress' ? (
                'Continue Training'
              ) : status === 'completed' ? (
                'Practice Again'
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading training scenarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredScenarios = selectedCategory === 'all' 
    ? scenarios 
    : getScenariosByCategory(selectedCategory);

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {summary.completed_scenarios}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.in_progress_scenarios}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.total_scenarios - summary.completed_scenarios - summary.in_progress_scenarios}
                </div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(summary.average_score)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{summary.completed_scenarios}/{summary.total_scenarios}</span>
              </div>
              <Progress 
                value={(summary.completed_scenarios / summary.total_scenarios) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredScenarios.map(renderScenarioCard)}
          </div>
          
          {filteredScenarios.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p>No training scenarios available in this category.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};