import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Play, Clock, Trophy, Download, ExternalLink, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Module components
import UserWelcomeModule from '@/components/user-training/UserWelcomeModule';
import OnboardingExperienceModule from '@/components/user-training/OnboardingExperienceModule';
import RecoveryJourneyModule from '@/components/user-training/RecoveryJourneyModule';
import PeerChatModule from '@/components/user-training/PeerChatModule';
import DailyPromptsModule from '@/components/user-training/DailyPromptsModule';
import ToolboxModule from '@/components/user-training/ToolboxModule';
import UserTrainingQuiz from '@/components/user-training/UserTrainingQuiz';
import UserTrainingCompletion from '@/components/user-training/UserTrainingCompletion';

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  component: React.ComponentType<any>;
}

const UserExperienceTrainingPortal = () => {
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const modules: Module[] = [
    {
      id: 'welcome',
      title: 'Welcome to LEAP',
      description: 'Experience the user welcome and first impressions',
      duration: '3 min',
      completed: completedModules.has('welcome'),
      component: UserWelcomeModule
    },
    {
      id: 'onboarding',
      title: 'User Onboarding Flow',
      description: 'Walk through how new users get started and set up their profile',
      duration: '4 min',
      completed: completedModules.has('onboarding'),
      component: OnboardingExperienceModule
    },
    {
      id: 'recovery-journey',
      title: 'Recovery Journey Experience',
      description: 'See how users navigate their recovery calendar and milestones',
      duration: '4 min',
      completed: completedModules.has('recovery-journey'),
      component: RecoveryJourneyModule
    },
    {
      id: 'peer-chat',
      title: 'Peer Support & Chat',
      description: 'Experience how users connect with peers and specialists',
      duration: '3 min',
      completed: completedModules.has('peer-chat'),
      component: PeerChatModule
    },
    {
      id: 'daily-prompts',
      title: 'Daily Prompts & Exercises',
      description: 'Try the interactive exercises and reflection prompts users receive',
      duration: '4 min',
      completed: completedModules.has('daily-prompts'),
      component: DailyPromptsModule
    },
    {
      id: 'toolbox',
      title: 'Recovery Toolbox',
      description: 'Explore coping tools, breathing exercises, and wisdom library',
      duration: '3 min',
      completed: completedModules.has('toolbox'),
      component: ToolboxModule
    }
  ];

  const totalModules = modules.length;
  const progressPercentage = (completedModules.size / totalModules) * 100;
  const allModulesCompleted = completedModules.size === totalModules;

  const handleModuleComplete = (moduleId: string) => {
    setCompletedModules(prev => new Set([...prev, moduleId]));
    setCurrentModule(null);
    toast.success('Module completed!', {
      description: 'Great job! You can move on to the next module.'
    });
  };

  const handleStartModule = (moduleId: string) => {
    setCurrentModule(moduleId);
  };

  const handleQuizComplete = (score: number) => {
    setQuizScore(score);
    setQuizCompleted(true);
    setCurrentModule(null);
    
    if (score >= 15) {
      setShowCompletion(true);
      toast.success('Congratulations!', {
        description: 'You passed the quiz and are now LEAP Platform Certified!'
      });
    } else {
      toast.error('Quiz needs retaking', {
        description: 'You need at least 15/20 to pass. You can retake the quiz anytime.'
      });
    }
  };

  const renderCurrentModule = () => {
    if (showCompletion) {
      return <UserTrainingCompletion score={quizScore} onReturnToPortal={() => setShowCompletion(false)} />;
    }

    if (currentModule === 'quiz') {
      return <UserTrainingQuiz onComplete={handleQuizComplete} />;
    }

    if (currentModule) {
      const module = modules.find(m => m.id === currentModule);
      if (module) {
        const Component = module.component;
        return <Component onComplete={() => handleModuleComplete(currentModule)} />;
      }
    }

    return null;
  };

  if (currentModule || showCompletion) {
    return (
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentModule || 'completion'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentModule()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">LEAP User Experience Training</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              User Training
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => window.history.back()} variant="outline" size="sm">
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Experience LEAP Through Your Users' Eyes</h2>
                <p className="text-primary-foreground/80">Walk through the complete user journey in 20-25 minutes</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-primary-foreground/80">Progress</div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {completedModules.size}/{totalModules} Complete
                </Badge>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <Progress value={progressPercentage} className="h-2 bg-white/20" />
            </div>
          </CardContent>
        </Card>

        {/* Training Modules Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                module.completed ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {module.completed && <CheckCircle className="h-5 w-5 text-primary" />}
                        {module.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                    <Badge variant={module.completed ? "default" : "secondary"} className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {module.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => handleStartModule(module.id)}
                    className="w-full"
                    variant={module.completed ? "outline" : "default"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {module.completed ? 'Review Module' : 'Start Module'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quiz Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className={`mb-8 ${allModulesCompleted ? 'border-primary bg-primary/5' : 'opacity-60'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Platform Knowledge Quiz
                {quizCompleted && quizScore >= 15 && <CheckCircle className="h-5 w-5 text-primary" />}
              </CardTitle>
              <CardDescription>
                Complete all modules first, then take the 20-question quiz to earn your certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {quizCompleted ? `Score: ${quizScore}/20 ${quizScore >= 15 ? '(Passed)' : '(Needs Retake)'}` : '20 questions • Passing score: 15/20'}
                </div>
                <Button
                  onClick={() => setCurrentModule('quiz')}
                  disabled={!allModulesCompleted}
                  variant={quizCompleted && quizScore >= 15 ? "outline" : "default"}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {quizCompleted ? (quizScore >= 15 ? 'Retake Quiz' : 'Retake Quiz') : 'Take Quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Status */}
        {allModulesCompleted && quizCompleted && quizScore >= 15 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Congratulations! You're LEAP Platform Certified! 🎉
                </h3>
                <p className="text-muted-foreground mb-6">
                  You've experienced the complete user journey and understand how LEAP works.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={() => setShowCompletion(true)}>
                    <Trophy className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Launch LEAP App
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    User Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserExperienceTrainingPortal;