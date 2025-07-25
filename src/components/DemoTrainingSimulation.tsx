import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  User, 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Clock,
  ArrowLeft,
  Lightbulb
} from 'lucide-react';

interface TrainingMessage {
  id: string;
  content: string;
  sender: 'user' | 'specialist' | 'system';
  timestamp: Date;
  evaluation?: {
    score: number;
    feedback: string;
    positive: string[];
    improvements: string[];
  };
}

interface DemoTrainingSimulationProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DemoTrainingSimulation = ({ isVisible, onClose }: DemoTrainingSimulationProps) => {
  const [messages, setMessages] = useState<TrainingMessage[]>([
    {
      id: '1',
      content: "Hi, I'm having a really hard time today. I feel like I'm about to relapse and I don't know what to do. Everything feels overwhelming.",
      sender: 'user',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const scenario = {
    title: "Crisis Support - Relapse Prevention",
    description: "A client is expressing strong urges and feeling overwhelmed. Your goal is to provide immediate support, validate their feelings, and guide them through coping strategies.",
    maxSteps: 3,
    hints: [
      "Start by acknowledging their courage in reaching out",
      "Validate their feelings without judgment", 
      "Ask about immediate safety and coping strategies",
      "Guide them through grounding techniques",
      "Remind them of their progress and strengths"
    ]
  };

  const evaluateResponse = (response: string): TrainingMessage['evaluation'] => {
    const lowerResponse = response.toLowerCase();
    let score = 0;
    const positive: string[] = [];
    const improvements: string[] = [];

    // Check for positive elements
    if (lowerResponse.includes('thank') || lowerResponse.includes('appreciate') || lowerResponse.includes('courage')) {
      score += 20;
      positive.push("Good acknowledgment of their courage");
    }
    
    if (lowerResponse.includes('feel') || lowerResponse.includes('understand') || lowerResponse.includes('hear you')) {
      score += 25;
      positive.push("Excellent validation of their feelings");
    }
    
    if (lowerResponse.includes('safe') || lowerResponse.includes('breath') || lowerResponse.includes('grounding')) {
      score += 25;
      positive.push("Appropriate focus on immediate safety/coping");
    }
    
    if (lowerResponse.includes('together') || lowerResponse.includes('support') || lowerResponse.includes('not alone')) {
      score += 20;
      positive.push("Strong emphasis on support and connection");
    }
    
    if (lowerResponse.includes('strength') || lowerResponse.includes('progress') || lowerResponse.includes('proud')) {
      score += 10;
      positive.push("Good reinforcement of their resilience");
    }

    // Check for areas of improvement
    if (!lowerResponse.includes('feel') && !lowerResponse.includes('understand')) {
      improvements.push("Consider validating their emotions more explicitly");
    }
    
    if (lowerResponse.includes('should') || lowerResponse.includes('need to')) {
      score -= 15;
      improvements.push("Avoid directive language; use collaborative approach");
    }
    
    if (lowerResponse.length < 20) {
      improvements.push("Response could be more comprehensive");
    }

    // Ensure minimum score
    score = Math.max(score, 30);
    
    let feedback = "";
    if (score >= 80) feedback = "Excellent response! You demonstrated strong peer support skills.";
    else if (score >= 60) feedback = "Good response with room for improvement.";
    else feedback = "This response needs work. Consider the suggested improvements.";

    return { score, feedback, positive, improvements };
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add specialist response
    const specialistMessage: TrainingMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'specialist',
      timestamp: new Date()
    };

    // Evaluate the response
    const evaluation = evaluateResponse(inputValue);
    specialistMessage.evaluation = evaluation;

    setMessages(prev => [...prev, specialistMessage]);
    setTotalScore(prev => prev + evaluation.score);
    setInputValue('');

    // Add system feedback
    setTimeout(() => {
      const feedbackMessage: TrainingMessage = {
        id: (Date.now() + 1).toString(),
        content: `Training Evaluation: ${evaluation.feedback}`,
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, feedbackMessage]);

      // Progress to next step or complete
      if (currentStep < scenario.maxSteps) {
        setCurrentStep(prev => prev + 1);
        // Add next user message
        setTimeout(() => {
          const nextUserMessages = [
            "Thank you for saying that. I just... I don't know how to get through this feeling. What if I can't handle it?",
            "That helps a little. But I'm still really scared. How do I know I won't mess up again?",
            "I think I understand. Can you help me think of some specific things I can do right now?"
          ];
          
          const nextMessage: TrainingMessage = {
            id: (Date.now() + 2).toString(),
            content: nextUserMessages[currentStep - 1] || "Thank you for your help. I'm feeling a bit better now.",
            sender: 'user',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, nextMessage]);
        }, 1500);
      } else {
        setIsCompleted(true);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetSimulation = () => {
    setMessages([{
      id: '1',
      content: "Hi, I'm having a really hard time today. I feel like I'm about to relapse and I don't know what to do. Everything feels overwhelming.",
      sender: 'user',
      timestamp: new Date()
    }]);
    setCurrentStep(1);
    setTotalScore(0);
    setIsCompleted(false);
  };

  if (!isVisible) return null;

  const averageScore = Math.round(totalScore / Math.max(currentStep - 1, 1));
  const progress = (currentStep / scenario.maxSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-background border shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Bot className="text-primary" size={20} />
                </div>
                <div>
                  <div className="text-lg font-semibold">{scenario.title}</div>
                  <div className="text-sm text-muted-foreground font-normal">{scenario.description}</div>
                </div>
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-500">TRAINING</Badge>
              <Button variant="outline" size="sm" onClick={onClose}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Demo
              </Button>
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: Step {currentStep} of {scenario.maxSteps}</span>
              <span>Average Score: {averageScore}/100</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.sender === 'specialist' ? 'justify-end' : message.sender === 'system' ? 'justify-center' : 'justify-start'}`}
                  >
                    {message.sender === 'system' ? (
                      <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-sm max-w-[80%] text-center">
                        <AlertCircle size={16} className="inline mr-2" />
                        {message.content}
                      </div>
                    ) : (
                      <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'specialist' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={message.sender === 'specialist' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                            {message.sender === 'specialist' ? 'You' : <User size={16} />}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 ${
                            message.sender === 'specialist'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`text-xs mt-1 opacity-70 ${message.sender === 'specialist' ? 'text-right' : ''}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Evaluation */}
                  {message.evaluation && (
                    <div className="mt-2 ml-10">
                      <div className="bg-background border rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="text-yellow-500" size={16} />
                          <span className="font-semibold">Score: {message.evaluation.score}/100</span>
                        </div>
                        {message.evaluation.positive.length > 0 && (
                          <div className="mb-2">
                            <div className="font-medium text-green-600 mb-1">✓ Strengths:</div>
                            <ul className="text-green-700 text-xs space-y-1">
                              {message.evaluation.positive.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {message.evaluation.improvements.length > 0 && (
                          <div>
                            <div className="font-medium text-orange-600 mb-1">⚠ Areas for improvement:</div>
                            <ul className="text-orange-700 text-xs space-y-1">
                              {message.evaluation.improvements.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            {!isCompleted && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response as a peer specialist..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size="icon"
                  >
                    <Send size={16} />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 Respond with empathy, validation, and practical support strategies
                </div>
              </div>
            )}

            {/* Completion */}
            {isCompleted && (
              <div className="border-t p-4 bg-green-50">
                <div className="text-center">
                  <CheckCircle2 className="text-green-500 mx-auto mb-2" size={32} />
                  <h3 className="font-semibold text-green-700 mb-2">Training Session Complete!</h3>
                  <p className="text-sm text-green-600 mb-4">
                    Final Score: {Math.round(totalScore / (currentStep - 1))}/100
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={resetSimulation} variant="outline">
                      Try Again
                    </Button>
                    <Button onClick={onClose}>
                      Back to Demo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hints Panel */}
          <div className="w-80 border-l bg-muted/30">
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2 mb-4"
              >
                <Lightbulb size={16} />
                {showHints ? 'Hide' : 'Show'} Training Hints
              </Button>
              
              {showHints && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Best Practices:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {scenario.hints.map((hint, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-6 p-3 bg-background rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Session Stats</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Step:</span>
                    <span>{currentStep}/{scenario.maxSteps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Score:</span>
                    <span>{averageScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span><Clock size={12} className="inline mr-1" />Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoTrainingSimulation;