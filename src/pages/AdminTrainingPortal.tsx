import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Play, Clock, Trophy, Download, ExternalLink, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Module components
import WelcomeModule from '@/components/admin-training/WelcomeModule';
import LoginDashboardModule from '@/components/admin-training/LoginDashboardModule';
import UserManagementModule from '@/components/admin-training/UserManagementModule';
import PromptSchedulingModule from '@/components/admin-training/PromptSchedulingModule';
import ChatEscalationModule from '@/components/admin-training/ChatEscalationModule';
import InsightsReportsModule from '@/components/admin-training/InsightsReportsModule';
import TrainingQuiz from '@/components/admin-training/TrainingQuiz';
import CompletionScreen from '@/components/admin-training/CompletionScreen';

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  component: React.ComponentType<any>;
}

const AdminTrainingPortal = () => {
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const modules: Module[] = [
    {
      id: 'welcome',
      title: 'Welcome & Orientation',
      description: 'Friendly intro to the LEAP admin portal and training overview',
      duration: '2 min',
      completed: completedModules.has('welcome'),
      component: WelcomeModule
    },
    {
      id: 'login-dashboard',
      title: 'Login & Dashboard Overview',
      description: 'Navigate the login process and understand the main dashboard',
      duration: '2 min',
      completed: completedModules.has('login-dashboard'),
      component: LoginDashboardModule
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Add users, assign peers, and manage accounts effectively',
      duration: '2 min',
      completed: completedModules.has('user-management'),
      component: UserManagementModule
    },
    {
      id: 'prompt-scheduling',
      title: 'Scheduling Daily Prompts',
      description: 'Create and schedule prompts, exercises, and content',
      duration: '2 min',
      completed: completedModules.has('prompt-scheduling'),
      component: PromptSchedulingModule
    },
    {
      id: 'chat-escalation',
      title: 'Chat Monitoring & Escalation',
      description: 'Monitor conversations and escalate concerns appropriately',
      duration: '2 min',
      completed: completedModules.has('chat-escalation'),
      component: ChatEscalationModule
    },
    {
      id: 'insights-reports',
      title: 'Insights & Reports',
      description: 'Analyze engagement data and generate reports',
      duration: '2 min',
      completed: completedModules.has('insights-reports'),
      component: InsightsReportsModule
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
    
    if (score >= 6) {
      setShowCompletion(true);
      toast.success('Congratulations!', {
        description: 'You passed the quiz and are now LEAP Admin Ready!'
      });
    } else {
      toast.error('Quiz needs retaking', {
        description: 'You need at least 6/8 to pass. You can retake the quiz anytime.'
      });
    }
  };

  const renderCurrentModule = () => {
    if (showCompletion) {
      return <CompletionScreen score={quizScore} onReturnToPortal={() => setShowCompletion(false)} />;
    }

    if (currentModule === 'quiz') {
      return <TrainingQuiz onComplete={handleQuizComplete} />;
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            LEAP Admin Training Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Master the admin portal in 10-15 minutes with interactive training
          </p>
          
          {/* Progress */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Training Progress</span>
              <span className="text-sm font-medium">{completedModules.size}/{totalModules} modules</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </motion.div>

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
                Knowledge Quiz
                {quizCompleted && quizScore >= 6 && <CheckCircle className="h-5 w-5 text-primary" />}
              </CardTitle>
              <CardDescription>
                Complete all modules first, then take the 8-question quiz to earn your certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {quizCompleted ? `Score: ${quizScore}/8 ${quizScore >= 6 ? '(Passed)' : '(Needs Retake)'}` : '8 questions • Passing score: 6/8'}
                </div>
                <Button
                  onClick={() => setCurrentModule('quiz')}
                  disabled={!allModulesCompleted}
                  variant={quizCompleted && quizScore >= 6 ? "outline" : "default"}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {quizCompleted ? (quizScore >= 6 ? 'Retake Quiz' : 'Retake Quiz') : 'Take Quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Status */}
        {allModulesCompleted && quizCompleted && quizScore >= 6 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Congratulations! You're LEAP Admin Ready! 🎉
                </h3>
                <p className="text-muted-foreground mb-6">
                  You've completed all training modules and passed the quiz.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={() => setShowCompletion(true)}>
                    <Trophy className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Launch Admin Portal
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Quick Reference
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

export default AdminTrainingPortal;