import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface TrainingQuizProps {
  onComplete: (score: number) => void;
}

const TrainingQuiz: React.FC<TrainingQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "When a user reports feeling suicidal in a peer chat, what should be your immediate first step?",
      options: [
        "Wait to see if the peer specialist responds appropriately",
        "Immediately escalate to emergency protocols and crisis resources",
        "Send a gentle reminder about platform guidelines",
        "Archive the conversation to protect privacy"
      ],
      correct: 1,
      explanation: "Safety comes first. Any mention of self-harm or suicide requires immediate escalation to emergency protocols and crisis intervention resources."
    },
    {
      id: 2,
      question: "How often should you review and update the scheduled daily prompts for users?",
      options: [
        "Once a month is sufficient",
        "Only when users complain",
        "Weekly to ensure relevance and engagement",
        "Daily to micromanage content"
      ],
      correct: 2,
      explanation: "Weekly reviews ensure content stays fresh, relevant, and responsive to user engagement patterns while not overwhelming the system with constant changes."
    },
    {
      id: 3,
      question: "What's the best practice for assigning a peer specialist to a new user?",
      options: [
        "Assign randomly from available specialists",
        "Always assign the specialist with the lightest caseload",
        "Match based on recovery stage, interests, and specialist availability",
        "Let users choose from a full list of all specialists"
      ],
      correct: 2,
      explanation: "Thoughtful matching based on compatibility factors leads to better outcomes. Consider recovery stage, shared interests, and current specialist capacity."
    },
    {
      id: 4,
      question: "In the analytics dashboard, if you notice a user's engagement dropped significantly, what should you do?",
      options: [
        "Immediately remove them from the platform",
        "Flag for follow-up and consider peer specialist outreach",
        "Increase their daily prompts to re-engage them",
        "Wait a month to see if engagement naturally improves"
      ],
      correct: 1,
      explanation: "Engagement drops can signal struggles or life changes. Flag for follow-up and coordinate with their peer specialist for appropriate outreach."
    },
    {
      id: 5,
      question: "What information should you NEVER include in progress notes or user records?",
      options: [
        "General engagement metrics",
        "Specific details about illegal activities mentioned in chats",
        "Recovery milestone achievements",
        "Peer specialist assignment changes"
      ],
      correct: 1,
      explanation: "While serious safety concerns need escalation, specific illegal activity details in records could violate privacy and legal protections. Follow proper reporting protocols instead."
    },
    {
      id: 6,
      question: "When scheduling motivational content, what's the optimal frequency for most users?",
      options: [
        "Multiple times per day to maximize impact",
        "Once daily with consistent timing",
        "Every few days to avoid overwhelming",
        "Only when users specifically request it"
      ],
      correct: 1,
      explanation: "Daily consistent timing creates healthy routines and expectations. Too frequent can be overwhelming; too infrequent reduces the supportive momentum."
    },
    {
      id: 7,
      question: "If a peer specialist hasn't logged in for several days and has active users, what's your priority action?",
      options: [
        "Reassign all their users to other specialists immediately",
        "Send one reminder and wait another week",
        "Contact the specialist and prepare contingency coverage for their users",
        "Remove the specialist from the platform"
      ],
      correct: 2,
      explanation: "Reach out to understand the situation while ensuring user continuity. Specialists may have valid reasons for absence, but users need consistent support."
    },
    {
      id: 8,
      question: "What's the most important factor to consider when interpreting engagement data trends?",
      options: [
        "Compare all users to the highest performers",
        "Focus only on increasing numbers week over week",
        "Consider individual recovery journeys and external life factors",
        "Use engagement data to rank users for resource allocation"
      ],
      correct: 2,
      explanation: "Recovery isn't linear. Engagement fluctuates due to personal circumstances, recovery stage, and life events. Context matters more than raw numbers."
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz completed
      const finalAnswers = [...answers];
      if (selectedAnswer !== null) {
        finalAnswers[currentQuestion] = selectedAnswer;
      }
      
      const score = finalAnswers.reduce((acc, answer, index) => {
        return acc + (answer === questions[index].correct ? 1 : 0);
      }, 0);
      
      setQuizCompleted(true);
      setTimeout(() => onComplete(score), 1500);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
      setShowFeedback(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === questions[currentQuestion].correct;

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Card className="p-8 text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
            <p className="text-muted-foreground">
              Calculating your results...
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Admin Knowledge Quiz
            </h1>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl leading-relaxed">
                  {questions[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswer?.toString()}
                  onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                  disabled={showFeedback}
                >
                  {questions[currentQuestion].options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        showFeedback
                          ? index === questions[currentQuestion].correct
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : selectedAnswer === index && index !== questions[currentQuestion].correct
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                            : 'border-muted'
                          : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer leading-relaxed"
                      >
                        {option}
                      </Label>
                      {showFeedback && index === questions[currentQuestion].correct && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {showFeedback && selectedAnswer === index && index !== questions[currentQuestion].correct && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </RadioGroup>

                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 rounded-lg border ${
                      isCorrect 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-semibold mb-2 ${
                          isCorrect ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {isCorrect ? 'Correct!' : 'Not quite right.'}
                        </p>
                        <p className={`text-sm ${
                          isCorrect ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {questions[currentQuestion].explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {!showFeedback ? (
            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null}
            >
              Submit Answer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleContinue}>
              {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingQuiz;