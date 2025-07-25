import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrainingScenarios } from '@/hooks/useTrainingScenarios';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { toast } from '@/hooks/use-toast';

import InteractiveTrainingModule from './InteractiveTrainingModule';
import { createDigitalEthicalLiteracyModule } from './modules/DigitalEthicalLiteracyModule';
import { createSafetyRiskModule } from './modules/SafetyRiskModule';
import { createRoleScopeModule } from './modules/RoleScopeModule';
import { createValuesPrinciplesModule } from './modules/ValuesPrinciplesModule';
import { createSelfHelpMutualSupportModule } from './modules/SelfHelpMutualSupportModule';

interface PeerSpecialistTrainingModulesProps {
  specialistId: string;
}

const PeerSpecialistTrainingModules: React.FC<PeerSpecialistTrainingModulesProps> = ({
  specialistId
}) => {
  const { language } = useLanguage();
  const { progress, completeScenario, startScenario } = useTrainingScenarios(specialistId);
  const { moduleMetrics, completeModule } = useModuleProgress(specialistId);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const modules = [
    createDigitalEthicalLiteracyModule(language),
    createSafetyRiskModule(language),
    createRoleScopeModule(language),
    createValuesPrinciplesModule(language),
    createSelfHelpMutualSupportModule(language)
  ];

  const getModuleProgressFromMetrics = (moduleId: string) => {
    return moduleMetrics?.moduleProgress.find(p => p.moduleId === moduleId);
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    
    const previousModule = modules[moduleIndex - 1];
    const previousProgress = getModuleProgressFromMetrics(previousModule.id);
    
    return previousProgress?.isCompleted || false;
  };

  const handleModuleStart = async (moduleId: string) => {
    // Simply set the active module - no need to track scenarios for modules
    setActiveModule(moduleId);
  };

  const handleModuleComplete = async (moduleId: string, score: number, timeSpent: number, reflection: string) => {
    // Use the module completion system instead of scenario system
    await completeModule(moduleId, score);
    
    toast({
      title: 'Module Completed!',
      description: `You scored ${score}% and completed the module in ${timeSpent} minutes.`,
    });
    
    setActiveModule(null);
  };

  const activeModuleData = modules.find(m => m.id === activeModule);

  if (activeModule && activeModuleData) {
    return (
      <InteractiveTrainingModule
        module={activeModuleData}
        onComplete={(score, timeSpent, reflection) => 
          handleModuleComplete(activeModule, score, timeSpent, reflection)
        }
        onExit={() => setActiveModule(null)}
      />
    );
  }

  const completedCount = moduleMetrics?.completedModules || 0;
  const progressPercentage = moduleMetrics?.completionRate || 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Peer Support Specialist Training</h1>
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{completedCount}/{modules.length} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </div>

      <div className="grid gap-6">
        {modules.map((module, index) => {
          const moduleProgress = getModuleProgressFromMetrics(module.id);
          const isCompleted = moduleProgress?.isCompleted || false;
          const isInProgress = false; // Modules are either completed or not started
          const isUnlocked = isModuleUnlocked(index);

          return (
            <Card key={module.id} className={`${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <module.icon className={`h-8 w-8 mt-1 ${
                      isCompleted ? 'text-green-600' : 
                      isUnlocked ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {module.title}
                        {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {!isUnlocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">{module.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.duration}
                        </div>
                        <span>{module.objectives.length} objectives</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    )}
                    {isInProgress && (
                      <Badge variant="secondary">
                        In Progress
                      </Badge>
                    )}
                    {!isUnlocked && (
                      <Badge variant="outline">
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Learning Objectives:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {module.objectives.slice(0, 3).map((objective, i) => (
                        <li key={i}>• {objective}</li>
                      ))}
                      {module.objectives.length > 3 && (
                        <li>• And {module.objectives.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {moduleProgress?.score && (
                        <span className="text-sm text-muted-foreground">
                          Score: {moduleProgress.score}%
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleModuleStart(module.id)}
                      disabled={!isUnlocked}
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isCompleted ? 'Retake' : isInProgress ? 'Continue' : 'Start Module'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PeerSpecialistTrainingModules;