import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface UserTrainingQuizProps {
  onComplete: (score: number) => void;
}

const UserTrainingQuiz = ({ onComplete }: UserTrainingQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "What is the primary purpose of LEAP's welcome screen?",
      options: [
        "To collect user data immediately",
        "To create a sense of safety and belonging",
        "To display app features",
        "To verify user identity"
      ],
      correctAnswer: 1,
      explanation: "The welcome screen focuses on creating psychological safety and a sense of belonging, which is crucial for users in recovery."
    },
    {
      id: 2,
      question: "During onboarding, what should users feel most confident about?",
      options: [
        "Their technical skills",
        "The app's features",
        "Their privacy and data security",
        "Meeting other users"
      ],
      correctAnswer: 2,
      explanation: "Privacy and security are paramount concerns for users in recovery, and this confidence must be established early."
    },
    {
      id: 3,
      question: "What role do peer specialists play in the LEAP platform?",
      options: [
        "Technical support only",
        "Administrative oversight",
        "Trained support with lived experience",
        "Content creation"
      ],
      correctAnswer: 2,
      explanation: "Peer specialists are trained professionals who have personal experience with recovery, making them uniquely qualified to provide support."
    },
    {
      id: 4,
      question: "How should users approach their recovery calendar?",
      options: [
        "Complete everything perfectly",
        "Focus only on major milestones",
        "Take it one day at a time",
        "Skip difficult days"
      ],
      correctAnswer: 2,
      explanation: "Recovery is a daily process, and users should be encouraged to focus on progress one day at a time rather than perfection."
    },
    {
      id: 5,
      question: "What is the most important aspect of peer-to-peer chat?",
      options: [
        "Sharing personal details",
        "Giving advice to others",
        "Listening and offering support",
        "Solving everyone's problems"
      ],
      correctAnswer: 2,
      explanation: "Peer support is primarily about listening, understanding, and offering mutual support rather than giving advice or solving problems."
    },
    {
      id: 6,
      question: "When should users engage with daily prompts?",
      options: [
        "Only when they feel motivated",
        "At the same time every day",
        "When they have problems",
        "Once a week"
      ],
      correctAnswer: 1,
      explanation: "Consistency is key in recovery. Regular engagement with daily prompts helps build healthy habits and self-awareness."
    },
    {
      id: 7,
      question: "What is the purpose of the recovery toolbox?",
      options: [
        "Entertainment during downtime",
        "Coping strategies for difficult moments",
        "Social media content",
        "Educational videos"
      ],
      correctAnswer: 1,
      explanation: "The recovery toolbox provides immediate access to coping strategies and tools that users can employ during challenging moments."
    },
    {
      id: 8,
      question: "How should users view setbacks in their recovery journey?",
      options: [
        "As complete failures",
        "As learning opportunities",
        "As reasons to quit",
        "As signs they're not trying hard enough"
      ],
      correctAnswer: 1,
      explanation: "Setbacks are a normal part of recovery and should be viewed as learning opportunities rather than failures."
    },
    {
      id: 9,
      question: "What type of content should users expect in their daily prompts?",
      options: [
        "Only motivational quotes",
        "Varied content including reflection, exercises, and education",
        "Technical information only",
        "Entertainment content"
      ],
      correctAnswer: 1,
      explanation: "Daily prompts include a variety of content types to keep users engaged and address different aspects of recovery."
    },
    {
      id: 10,
      question: "How does LEAP protect user privacy in conversations?",
      options: [
        "No protection needed",
        "Basic password protection",
        "End-to-end encryption",
        "Public conversations only"
      ],
      correctAnswer: 2,
      explanation: "LEAP uses end-to-end encryption to ensure that private conversations remain secure and confidential."
    },
    {
      id: 11,
      question: "What should users do if they're having thoughts of self-harm?",
      options: [
        "Wait for their next appointment",
        "Post in group chat",
        "Contact crisis resources immediately",
        "Try to handle it alone"
      ],
      correctAnswer: 2,
      explanation: "Thoughts of self-harm require immediate professional attention through crisis resources, not peer support."
    },
    {
      id: 12,
      question: "How often should users check in with their recovery progress?",
      options: [
        "Only when problems arise",
        "Once a month",
        "Regularly, as part of daily routine",
        "Only during appointments"
      ],
      correctAnswer: 2,
      explanation: "Regular self-monitoring is a key component of successful recovery and helps users stay aware of their progress."
    },
    {
      id: 13,
      question: "What is the best way to support other users in the community?",
      options: [
        "Give detailed advice about what to do",
        "Share your own story and listen",
        "Tell them what worked for you",
        "Criticize their choices"
      ],
      correctAnswer: 1,
      explanation: "Effective peer support involves sharing experiences and listening rather than giving directive advice."
    },
    {
      id: 14,
      question: "How should users approach goal-setting in their recovery?",
      options: [
        "Set only long-term goals",
        "Avoid setting goals to prevent disappointment",
        "Set small, achievable daily goals",
        "Focus only on avoiding relapse"
      ],
      correctAnswer: 2,
      explanation: "Small, achievable daily goals help build momentum and confidence while making progress manageable."
    },
    {
      id: 15,
      question: "What should users do if they miss several days of engagement?",
      options: [
        "Give up and start over later",
        "Feel guilty and ashamed",
        "Simply return when ready without judgment",
        "Apologize to everyone"
      ],
      correctAnswer: 2,
      explanation: "Recovery is not about perfection. Users should be encouraged to return when ready without self-judgment."
    },
    {
      id: 16,
      question: "How does the strength meter help users?",
      options: [
        "It compares them to others",
        "It provides visual feedback on progress",
        "It determines their treatment plan",
        "It predicts future outcomes"
      ],
      correctAnswer: 1,
      explanation: "The strength meter provides visual feedback that helps users see their progress and stay motivated."
    },
    {
      id: 17,
      question: "When should users reach out to peer specialists?",
      options: [
        "Only during crises",
        "Only during business hours",
        "Whenever they need support or have questions",
        "Only once per week"
      ],
      correctAnswer: 2,
      explanation: "Peer specialists are available to provide support whenever users need it, not just during crises."
    },
    {
      id: 18,
      question: "What is the purpose of reflection exercises?",
      options: [
        "To waste time",
        "To increase self-awareness and insight",
        "To create content for sharing",
        "To test memory"
      ],
      correctAnswer: 1,
      explanation: "Reflection exercises help users develop self-awareness and gain insights into their recovery process."
    },
    {
      id: 19,
      question: "How should users view their recovery journey timeline?",
      options: [
        "As a strict schedule to follow",
        "As a unique, personal process",
        "As a competition with others",
        "As a linear progression"
      ],
      correctAnswer: 1,
      explanation: "Each person's recovery journey is unique and should not be compared to others or forced into a rigid timeline."
    },
    {
      id: 20,
      question: "What is the most important thing users should remember about using LEAP?",
      options: [
        "Perfect attendance is required",
        "It's a tool to support their recovery journey",
        "Other users depend on them",
        "They must graduate within a timeframe"
      ],
      correctAnswer: 1,
      explanation: "LEAP is a supportive tool designed to assist users in their recovery journey, not a requirement or obligation."
    },
    {
      id: 21,
      question: "In the Recovery Toolbox, what should users do when they feel an urge or craving?",
      options: [
        "Close the app and try to distract themselves",
        "Use the Urge Tracker tool to log and work through the feeling",
        "Immediately call a specialist",
        "Wait for the feeling to pass"
      ],
      correctAnswer: 1,
      explanation: "The Urge Tracker tool helps users log their feelings and provides guided steps to work through urges safely."
    },
    {
      id: 22,
      question: "How is the Recovery Strength Meter calculated?",
      options: [
        "Only by specialist assessments",
        "Based on app usage time only",
        "Through daily check-ins, tool usage, and engagement patterns",
        "By comparing to other users"
      ],
      correctAnswer: 2,
      explanation: "The strength meter uses multiple data points including daily check-ins, tool usage, and engagement to provide a comprehensive view of progress."
    },
    {
      id: 23,
      question: "What's the difference between Foreman Chat and Peer Specialist Chat?",
      options: [
        "There is no difference",
        "Foreman is AI-powered for immediate support, Peer Specialists are real people",
        "Foreman is only for emergencies",
        "Peer Specialists only work during business hours"
      ],
      correctAnswer: 1,
      explanation: "Foreman provides 24/7 AI-powered support for immediate help, while Peer Specialists are trained humans available during scheduled hours."
    },
    {
      id: 24,
      question: "In the Recovery Journey Calendar, how can users best track their daily progress?",
      options: [
        "Only mark major milestones",
        "Skip days when they don't feel good",
        "Complete daily check-ins and rate their day",
        "Wait for specialists to update it"
      ],
      correctAnswer: 2,
      explanation: "Daily check-ins and rating allow users to actively track their progress and help the app provide better personalized support."
    },
    {
      id: 25,
      question: "When should users request a phone call with a specialist?",
      options: [
        "For any question about the app",
        "Only during a crisis situation",
        "When they need more personal support or have complex concerns",
        "Never, chat is always sufficient"
      ],
      correctAnswer: 2,
      explanation: "Phone calls are valuable for more personal discussions, complex situations, or when users need deeper support beyond text chat."
    }
  ];

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(parseInt(value));
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      setAnswers(prev => ({ ...prev, [currentQuestion]: selectedAnswer }));
      setShowFeedback(true);
    }
  };

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz completed
      const finalAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      const score = questions.reduce((acc, question, index) => {
        return acc + (finalAnswers[index] === question.correctAnswer ? 1 : 0);
      }, 0);
      
      setQuizCompleted(true);
      onComplete(score);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
      setShowFeedback(false);
    }
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const isCorrect = selectedAnswer === currentQ.correctAnswer;

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-muted-foreground">
                Your results are being calculated...
              </p>
            </div>
            <div className="animate-pulse">
              <div className="h-2 bg-secondary rounded-full">
                <div className="h-2 bg-primary rounded-full w-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Platform Knowledge Quiz</h1>
            <Badge variant="outline">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
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
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {currentQ.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showFeedback ? (
                  <div className="space-y-4">
                    <RadioGroup value={selectedAnswer?.toString()} onValueChange={handleAnswerSelect}>
                      {currentQ.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show all options with feedback */}
                    {currentQ.options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                          index === currentQ.correctAnswer 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                            : index === selectedAnswer && index !== currentQ.correctAnswer
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                            : 'border-transparent bg-muted/30'
                        }`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          {index === currentQ.correctAnswer ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : index === selectedAnswer ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>
                        <span className={`flex-1 ${
                          index === currentQ.correctAnswer ? 'font-medium text-green-800 dark:text-green-200' :
                          index === selectedAnswer ? 'font-medium text-red-800 dark:text-red-200' : ''
                        }`}>
                          {option}
                        </span>
                      </div>
                    ))}
                    
                    {/* Explanation */}
                    <div className={`mt-4 p-4 rounded-lg ${
                      isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                        }`}>
                          {isCorrect ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-1">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < currentQuestion 
                    ? 'bg-primary' 
                    : index === currentQuestion 
                    ? 'bg-primary/50' 
                    : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={showFeedback ? handleContinue : handleNext}
            disabled={!showFeedback && selectedAnswer === null}
          >
            {showFeedback ? (
              currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'
            ) : (
              'Submit Answer'
            )}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserTrainingQuiz;