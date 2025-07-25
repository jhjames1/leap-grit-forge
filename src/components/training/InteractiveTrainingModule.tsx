import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  Target,
  MessageSquare,
  AlertTriangle,
  Heart,
  Users,
  Save
} from 'lucide-react';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: string;
  objectives: string[];
  sections: TrainingSection[];
  finalQuiz: QuizQuestion[];
  reflection: ReflectionPrompt;
}

export interface TrainingSection {
  id: string;
  title: string;
  type: 'content' | 'interactive' | 'simulation';
  content?: {
    text: string;
    media?: {
      type: 'image' | 'video' | 'audio';
      url: string;
      alt?: string;
    };
  };
  interactive?: {
    type: 'drag-drop' | 'matching' | 'checklist' | 'scenario';
    data: any;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'multiple-select';
  options: { id: string; text: string; correct?: boolean }[];
  explanation: string;
}

export interface ReflectionPrompt {
  question: string;
  placeholder: string;
  category: string;
}

interface InteractiveTrainingModuleProps {
  module: TrainingModule;
  onComplete: (score: number, timeSpent: number, reflection: string) => void;
  onExit: () => void;
}

const InteractiveTrainingModule: React.FC<InteractiveTrainingModuleProps> = ({
  module,
  onComplete,
  onExit
}) => {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [reflection, setReflection] = useState('');
  const [showResults, setShowResults] = useState(false);

  const totalSteps = module.sections.length + 2; // sections + quiz + reflection
  const progress = (currentStep / totalSteps) * 100;

  const markSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const handleQuizAnswer = (questionId: string, answer: string | string[]) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    let total = module.finalQuiz.length;

    module.finalQuiz.forEach(question => {
      const userAnswer = quizAnswers[question.id];
      
      if (question.type === 'multiple-choice') {
        const correctOption = question.options.find(opt => opt.correct);
        if (correctOption && userAnswer === correctOption.id) {
          correct++;
        }
      } else if (question.type === 'multiple-select') {
        const correctOptions = question.options.filter(opt => opt.correct).map(opt => opt.id);
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        
        if (correctOptions.length === userAnswers.length && 
            correctOptions.every(id => userAnswers.includes(id))) {
          correct++;
        }
      }
    });

    return Math.round((correct / total) * 100);
  };

  const handleComplete = () => {
    const score = calculateQuizScore();
    const timeSpent = Math.round((Date.now() - startTime) / 60000); // minutes
    
    if (score >= 80) {
      toast({
        title: t('training.moduleCompleted'),
        description: t('training.congratulations', { score }),
      });
      onComplete(score, timeSpent, reflection);
    } else {
      toast({
        title: t('training.needRetry'),
        description: t('training.minScoreRequired'),
        variant: 'destructive'
      });
      setShowResults(true);
    }
  };

  const renderSection = (section: TrainingSection, index: number) => {
    switch (section.type) {
      case 'content':
        return (
          <ContentSection 
            section={section} 
            onComplete={() => markSectionComplete(section.id)}
            language={language}
          />
        );
      case 'interactive':
        return (
          <InteractiveSection 
            section={section} 
            onComplete={() => markSectionComplete(section.id)}
            language={language}
          />
        );
      case 'simulation':
        return (
          <SimulationSection 
            section={section} 
            onComplete={() => markSectionComplete(section.id)}
            language={language}
          />
        );
      default:
        return null;
    }
  };

  const renderQuiz = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {t('training.quiz')}
        </CardTitle>
        <CardDescription>
          {t('training.quizInstructions')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {module.finalQuiz.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <h4 className="font-medium">{index + 1}. {question.question}</h4>
            
            {question.type === 'multiple-choice' ? (
              <RadioGroup
                value={quizAnswers[question.id] as string || ''}
                onValueChange={(value) => handleQuizAnswer(question.id, value)}
              >
                {question.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id}>{option.text}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {question.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={(quizAnswers[question.id] as string[] || []).includes(option.id)}
                      onCheckedChange={(checked) => {
                        const current = (quizAnswers[question.id] as string[]) || [];
                        const updated = checked 
                          ? [...current, option.id]
                          : current.filter(id => id !== option.id);
                        handleQuizAnswer(question.id, updated);
                      }}
                    />
                    <Label htmlFor={option.id}>{option.text}</Label>
                  </div>
                ))}
              </div>
            )}

            {showResults && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('training.explanation')}:
                </p>
                <p className="text-sm">{question.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderReflection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {t('training.reflection')}
        </CardTitle>
        <CardDescription>
          {module.reflection.question}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={module.reflection.placeholder}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="min-h-32"
        />
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            {t('training.saveToPortfolio')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {reflection.length} {t('training.characters')}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <module.icon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{module.title}</h1>
          </div>
          <p className="text-muted-foreground mb-4">{module.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {module.duration}
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {module.objectives.length} {t('training.objectives')}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onExit}>
          {t('common.exit')}
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('training.progress')}</span>
            <span className="text-sm text-muted-foreground">
              {currentStep}/{totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('training.learningObjectives')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {module.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={() => setCurrentStep(1)} 
              className="mt-6 gap-2"
            >
              {t('training.startModule')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Sections */}
      {currentStep > 0 && currentStep <= module.sections.length && (
        <div>
          {renderSection(module.sections[currentStep - 1], currentStep - 1)}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.previous')}
            </Button>
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              {t('common.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Quiz */}
      {currentStep === module.sections.length + 1 && (
        <div>
          {renderQuiz()}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.previous')}
            </Button>
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={Object.keys(quizAnswers).length < module.finalQuiz.length}
            >
              {t('common.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Reflection */}
      {currentStep === totalSteps && (
        <div>
          {renderReflection()}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.previous')}
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={reflection.length < 50}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t('training.completeModule')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components for different section types
const ContentSection: React.FC<{ section: TrainingSection; onComplete: () => void; language: string }> = ({ section, onComplete, language }) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) {
      onComplete();
    }
  }, [hasInteracted, onComplete]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {section.content?.text && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content.text }}
          />
        )}
        {section.content?.media && (
          <div className="flex justify-center">
            {section.content.media.type === 'image' && (
              <img 
                src={section.content.media.url} 
                alt={section.content.media.alt || ''} 
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {section.content.media.type === 'video' && (
              <video 
                src={section.content.media.url} 
                controls 
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {section.content.media.type === 'audio' && (
              <audio 
                src={section.content.media.url} 
                controls 
                className="w-full"
              />
            )}
          </div>
        )}
        <Button 
          onClick={() => setHasInteracted(true)}
          disabled={hasInteracted}
          className="gap-2"
        >
          {hasInteracted ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Completed
            </>
          ) : (
            'Mark as Read'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const InteractiveSection: React.FC<{ section: TrainingSection; onComplete: () => void; language: string }> = ({ section, onComplete, language }) => {
  const [completed, setCompleted] = useState(false);

  const handleInteractionComplete = () => {
    setCompleted(true);
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Interactive component would be rendered here based on section.interactive.type */}
        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            Interactive component: {section.interactive?.type}
          </p>
          <Button onClick={handleInteractionComplete}>
            Complete Interaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SimulationSection: React.FC<{ section: TrainingSection; onComplete: () => void; language: string }> = ({ section, onComplete, language }) => {
  const [completed, setCompleted] = useState(false);

  const handleSimulationComplete = () => {
    setCompleted(true);
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simulation component would be rendered here */}
        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            Simulation: {section.interactive?.type}
          </p>
          <Button onClick={handleSimulationComplete}>
            Complete Simulation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveTrainingModule;