import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/utils/logger';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  completed: boolean;
  unlocked: boolean;
  prerequisites?: string[];
  scenarios: TrainingScenario[];
}

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  type: 'chat' | 'calendar' | 'crisis' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  steps: TrainingStep[];
}

export interface TrainingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  content: string;
  action?: 'click' | 'input' | 'observe';
  completed: boolean;
}

export interface TrainingProgress {
  currentModule?: string;
  currentScenario?: string;
  currentStep?: string;
  completedModules: string[];
  completedScenarios: string[];
  totalScore: number;
  lastActivity: Date;
}

interface TrainingContextValue {
  modules: TrainingModule[];
  progress: TrainingProgress;
  isTrainingMode: boolean;
  currentTour: string | null;
  startModule: (moduleId: string) => void;
  completeStep: (moduleId: string, scenarioId: string, stepId: string) => void;
  completeScenario: (moduleId: string, scenarioId: string) => void;
  completeModule: (moduleId: string) => void;
  startTour: (tourId: string) => void;
  endTour: () => void;
  toggleTrainingMode: () => void;
  resetProgress: () => void;
}

const TrainingContext = createContext<TrainingContextValue | undefined>(undefined);

const defaultModules: TrainingModule[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of the peer specialist portal',
    duration: 15,
    completed: false,
    unlocked: true,
    scenarios: [
      {
        id: 'navigation',
        title: 'Portal Navigation',
        description: 'Learn how to navigate the specialist portal',
        type: 'general',
        difficulty: 'beginner',
        completed: false,
        steps: [
          {
            id: 'login',
            title: 'Login Process',
            description: 'Understanding the login workflow',
            target: '.login-form',
            content: 'Start by logging into the specialist portal using your credentials.',
            action: 'observe',
            completed: false
          },
          {
            id: 'dashboard',
            title: 'Dashboard Overview',
            description: 'Familiarize yourself with the main dashboard',
            target: '.dashboard-main',
            content: 'This is your main dashboard where you can see active sessions and metrics.',
            action: 'observe',
            completed: false
          }
        ]
      }
    ]
  },
  {
    id: 'chat-management',
    title: 'Chat Management',
    description: 'Master the art of peer-to-peer communication',
    duration: 30,
    completed: false,
    unlocked: false,
    prerequisites: ['getting-started'],
    scenarios: [
      {
        id: 'basic-chat',
        title: 'Basic Chat Operations',
        description: 'Learn to handle routine peer conversations',
        type: 'chat',
        difficulty: 'beginner',
        completed: false,
        steps: [
          {
            id: 'accept-chat',
            title: 'Accepting Chat Requests',
            description: 'Learn how to accept incoming chat requests',
            target: '.chat-request-button',
            content: 'When a peer requests a chat, you\'ll see a notification. Click to accept.',
            action: 'click',
            completed: false
          }
        ]
      },
      {
        id: 'crisis-response',
        title: 'Crisis Response',
        description: 'Handle emergency situations effectively',
        type: 'crisis',
        difficulty: 'advanced',
        completed: false,
        steps: [
          {
            id: 'identify-crisis',
            title: 'Identifying Crisis Situations',
            description: 'Learn to recognize crisis indicators',
            content: 'Watch for keywords, emotional escalation, and direct statements of harm.',
            action: 'observe',
            completed: false
          }
        ]
      }
    ]
  },
  {
    id: 'calendar-scheduling',
    title: 'Calendar & Scheduling',
    description: 'Manage your availability and appointments',
    duration: 20,
    completed: false,
    unlocked: false,
    prerequisites: ['getting-started'],
    scenarios: [
      {
        id: 'availability',
        title: 'Setting Availability',
        description: 'Learn to manage your schedule',
        type: 'calendar',
        difficulty: 'beginner',
        completed: false,
        steps: [
          {
            id: 'set-hours',
            title: 'Set Working Hours',
            description: 'Configure your available hours',
            target: '.availability-settings',
            content: 'Set your working hours to let peers know when you\'re available.',
            action: 'click',
            completed: false
          }
        ]
      }
    ]
  }
];

const defaultProgress: TrainingProgress = {
  completedModules: [],
  completedScenarios: [],
  totalScore: 0,
  lastActivity: new Date()
};

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<TrainingModule[]>(defaultModules);
  const [progress, setProgress] = useState<TrainingProgress>(defaultProgress);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [currentTour, setCurrentTour] = useState<string | null>(null);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('specialist-training-progress');
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      logger.error('Failed to load training progress:', error);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('specialist-training-progress', JSON.stringify(progress));
    } catch (error) {
      logger.error('Failed to save training progress:', error);
    }
  }, [progress]);

  // Update module unlock status based on progress
  useEffect(() => {
    setModules(prev => prev.map(module => ({
      ...module,
      unlocked: module.prerequisites 
        ? module.prerequisites.every(prereq => progress.completedModules.includes(prereq))
        : true,
      completed: progress.completedModules.includes(module.id)
    })));
  }, [progress.completedModules]);

  const startModule = (moduleId: string) => {
    setProgress(prev => ({
      ...prev,
      currentModule: moduleId,
      lastActivity: new Date()
    }));
    logger.info(`Started training module: ${moduleId}`);
  };

  const completeStep = (moduleId: string, scenarioId: string, stepId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            scenarios: module.scenarios.map(scenario =>
              scenario.id === scenarioId
                ? {
                    ...scenario,
                    steps: scenario.steps.map(step =>
                      step.id === stepId ? { ...step, completed: true } : step
                    )
                  }
                : scenario
            )
          }
        : module
    ));

    setProgress(prev => ({
      ...prev,
      currentStep: stepId,
      totalScore: prev.totalScore + 10,
      lastActivity: new Date()
    }));
  };

  const completeScenario = (moduleId: string, scenarioId: string) => {
    setProgress(prev => ({
      ...prev,
      completedScenarios: [...prev.completedScenarios, scenarioId],
      totalScore: prev.totalScore + 50,
      lastActivity: new Date()
    }));
    logger.info(`Completed training scenario: ${scenarioId}`);
  };

  const completeModule = (moduleId: string) => {
    setProgress(prev => ({
      ...prev,
      completedModules: [...prev.completedModules, moduleId],
      currentModule: undefined,
      totalScore: prev.totalScore + 100,
      lastActivity: new Date()
    }));
    logger.info(`Completed training module: ${moduleId}`);
  };

  const startTour = (tourId: string) => {
    setCurrentTour(tourId);
    setIsTrainingMode(true);
  };

  const endTour = () => {
    setCurrentTour(null);
    setIsTrainingMode(false);
  };

  const toggleTrainingMode = () => {
    setIsTrainingMode(prev => !prev);
  };

  const resetProgress = () => {
    setProgress(defaultProgress);
    setModules(defaultModules);
    localStorage.removeItem('specialist-training-progress');
    logger.info('Training progress reset');
  };

  return (
    <TrainingContext.Provider value={{
      modules,
      progress,
      isTrainingMode,
      currentTour,
      startModule,
      completeStep,
      completeScenario,
      completeModule,
      startTour,
      endTour,
      toggleTrainingMode,
      resetProgress
    }}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}