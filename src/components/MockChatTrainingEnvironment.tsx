import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  User, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  Star
} from 'lucide-react';
import { TrainingScenario, useTrainingScenarios } from '@/hooks/useTrainingScenarios';

interface MockMessage {
  id: string;
  from: 'user' | 'specialist' | 'system';
  message: string;
  timestamp: number;
  evaluation?: {
    score: number;
    feedback: string[];
    elements_covered: string[];
    elements_missed: string[];
  };
}

interface MockChatTrainingEnvironmentProps {
  scenario: TrainingScenario;
  progressId: string;
  specialistId: string;
  onComplete: (score: number, feedback: any) => void;
  onExit: () => void;
}

export const MockChatTrainingEnvironment: React.FC<MockChatTrainingEnvironmentProps> = ({
  scenario,
  progressId,
  specialistId,
  onComplete,
  onExit
}) => {
  const { logTrainingAction } = useTrainingScenarios(specialistId);
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionStartTime] = useState(Date.now());
  const [currentStep, setCurrentStep] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with scenario's initial messages
  useEffect(() => {
    const initialMessages: MockMessage[] = [
      {
        id: 'system-intro',
        from: 'system',
        message: `Training Scenario: ${scenario.title}. You are chatting with ${scenario.scenario_data.mock_user.name}. Remember to follow best practices for peer support.`,
        timestamp: Date.now()
      },
      ...scenario.scenario_data.initial_messages.map((msg, index) => ({
        id: `initial-${index}`,
        from: msg.from as 'user' | 'specialist',
        message: msg.message,
        timestamp: Date.now() + index * 1000
      }))
    ];

    setMessages(initialMessages);
    
    // Log session start
    logTrainingAction(progressId, 'session_started', {
      scenario_id: scenario.id,
      mock_user: scenario.scenario_data.mock_user
    });
  }, [scenario, progressId]);

  const evaluateResponse = (message: string): { score: number; feedback: string[]; elements_covered: string[]; elements_missed: string[] } => {
    const expectedElements = scenario.scenario_data.expected_response_elements;
    const evaluationCriteria = scenario.scenario_data.evaluation_criteria;
    
    // Simple keyword-based evaluation (in a real system, this would be more sophisticated)
    const messageWords = message.toLowerCase().split(/\s+/);
    const elementsCovered: string[] = [];
    const elementsMissed: string[] = [];
    
    expectedElements.forEach(element => {
      // Basic keyword matching - this is simplified for demo purposes
      const keywords = {
        warm_greeting: ['hello', 'hi', 'welcome', 'nice', 'glad'],
        reassurance: ['safe', 'okay', 'normal', 'understand', 'here'],
        explanation_of_process: ['process', 'how', 'work', 'expect', 'session'],
        confidentiality_mention: ['confidential', 'private', 'secure', 'safe'],
        immediate_concern_acknowledgment: ['concern', 'worried', 'understand', 'hear'],
        risk_assessment_questions: ['feel', 'plan', 'thoughts', 'safe', 'help'],
        professional_resource_referral: ['crisis', 'hotline', 'professional', 'emergency', 'counselor'],
        safety_plan_discussion: ['safety', 'plan', 'support', 'resources', 'steps'],
        validation_of_feelings: ['valid', 'understand', 'feel', 'normal', 'acknowledge'],
        active_listening: ['tell', 'more', 'listen', 'hear', 'experience'],
        personalized_approach: ['you', 'your', 'specific', 'particular', 'unique'],
        boundary_setting: ['boundary', 'appropriate', 'professional', 'limit'],
        celebration_of_progress: ['great', 'wonderful', 'progress', 'proud', 'achievement'],
        specific_technique_discussion: ['technique', 'strategy', 'method', 'approach', 'skill'],
        goal_setting: ['goal', 'next', 'plan', 'objective', 'target'],
        continued_support_offer: ['support', 'here', 'continue', 'help', 'available']
      };
      
      const elementKeywords = keywords[element as keyof typeof keywords] || [];
      const hasElement = elementKeywords.some(keyword => 
        messageWords.some(word => word.includes(keyword))
      );
      
      if (hasElement) {
        elementsCovered.push(element);
      } else {
        elementsMissed.push(element);
      }
    });
    
    const score = Math.round((elementsCovered.length / expectedElements.length) * 100);
    
    // Generate feedback based on evaluation criteria
    const feedbackMessages: string[] = [];
    Object.entries(evaluationCriteria).forEach(([criterion, question]) => {
      // Simplified feedback generation
      if (elementsCovered.length > expectedElements.length * 0.7) {
        feedbackMessages.push(`✓ ${criterion}: Good job addressing this aspect.`);
      } else {
        feedbackMessages.push(`⚠ ${criterion}: ${question}`);
      }
    });
    
    return { score, feedback: feedbackMessages, elements_covered: elementsCovered, elements_missed: elementsMissed };
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const newMessage: MockMessage = {
      id: `specialist-${Date.now()}`,
      from: 'specialist',
      message: currentMessage.trim(),
      timestamp: Date.now()
    };

    // Evaluate the response
    const evaluation = evaluateResponse(currentMessage);
    newMessage.evaluation = evaluation;

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setCurrentStep(prev => prev + 1);

    // Update session score (weighted average)
    setSessionScore(prev => Math.round((prev + evaluation.score) / 2));
    setFeedback(prev => [...prev, ...evaluation.feedback]);

    // Log the action
    await logTrainingAction(progressId, 'message_sent', {
      message: currentMessage,
      evaluation: evaluation,
      step: currentStep + 1
    });

    // Simulate mock user response based on specialist's message
    setTimeout(() => {
      const mockResponses = generateMockUserResponse(currentMessage, evaluation.score);
      if (mockResponses.length > 0) {
        const mockMessage: MockMessage = {
          id: `user-${Date.now()}`,
          from: 'user',
          message: mockResponses[0],
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, mockMessage]);
      }
    }, 1500);
  };

  const generateMockUserResponse = (specialistMessage: string, score: number): string[] => {
    const { mock_user } = scenario.scenario_data;
    
    // Generate contextual responses based on user mood and specialist performance
    if (score >= 80) {
      // Good response
      if (mock_user.mood === 'nervous') {
        return ["Thank you, that makes me feel a bit better. I appreciate you taking the time to explain that."];
      } else if (mock_user.mood === 'distressed') {
        return ["I... I think I can try that. It's hard, but having someone who listens helps."];
      } else if (mock_user.mood === 'frustrated') {
        return ["Okay, I can see you're actually trying to understand. Maybe we can work on this together."];
      } else if (mock_user.mood === 'positive') {
        return ["Exactly! That's what I've been working on. It feels good to talk about it."];
      }
    } else if (score >= 60) {
      // Moderate response
      if (mock_user.mood === 'nervous') {
        return ["I think I understand what you're saying. Can you tell me more about what to expect?"];
      } else if (mock_user.mood === 'distressed') {
        return ["I'm not sure... it's hard to think clearly right now. What should I do?"];
      } else if (mock_user.mood === 'frustrated') {
        return ["I guess that makes some sense, but I'm still not sure this is helping."];
      } else if (mock_user.mood === 'positive') {
        return ["That's a good point. I want to keep building on what's working."];
      }
    } else {
      // Poor response
      if (mock_user.mood === 'nervous') {
        return ["I'm still not really sure what this is about. I'm feeling more confused now."];
      } else if (mock_user.mood === 'distressed') {
        return ["That doesn't really help... I thought you would understand better."];
      } else if (mock_user.mood === 'frustrated') {
        return ["See? This is exactly what I mean. You're not really listening to me."];
      } else if (mock_user.mood === 'positive') {
        return ["Hmm, I'm not sure that relates to what I was talking about."];
      }
    }
    
    return ["Can you help me understand what you mean by that?"];
  };

  const handleShowHints = async () => {
    setShowHints(!showHints);
    await logTrainingAction(progressId, 'hint_used', {
      step: currentStep,
      scenario_elements: scenario.scenario_data.expected_response_elements
    });
  };

  const handleCompleteSession = async () => {
    const timeSpentMinutes = Math.round((Date.now() - sessionStartTime) / 60000);
    
    const sessionFeedback = {
      total_messages: messages.filter(m => m.from === 'specialist').length,
      average_score: sessionScore,
      time_spent_minutes: timeSpentMinutes,
      elements_addressed: feedback.filter(f => f.startsWith('✓')).length,
      areas_for_improvement: feedback.filter(f => f.startsWith('⚠')),
      scenario_category: scenario.category,
      difficulty_level: scenario.difficulty_level
    };

    await logTrainingAction(progressId, 'session_completed', sessionFeedback);
    onComplete(sessionScore, sessionFeedback);
  };

  const handleRestart = async () => {
    setMessages([]);
    setCurrentMessage('');
    setCurrentStep(0);
    setSessionScore(0);
    setFeedback([]);
    setShowHints(false);
    
    // Reinitialize
    const initialMessages: MockMessage[] = [
      {
        id: 'system-intro',
        from: 'system',
        message: `Training Scenario: ${scenario.title}. You are chatting with ${scenario.scenario_data.mock_user.name}. Remember to follow best practices for peer support.`,
        timestamp: Date.now()
      },
      ...scenario.scenario_data.initial_messages.map((msg, index) => ({
        id: `initial-${index}`,
        from: msg.from as 'user' | 'specialist',
        message: msg.message,
        timestamp: Date.now() + index * 1000
      }))
    ];

    setMessages(initialMessages);
    
    await logTrainingAction(progressId, 'session_restarted', {
      previous_score: sessionScore,
      restart_step: currentStep
    });
  };

  const timeSpentMinutes = Math.round((Date.now() - sessionStartTime) / 60000);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {scenario.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {scenario.scenario_data.mock_user.name} ({scenario.scenario_data.mock_user.mood})
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeSpentMinutes} min
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Score: {sessionScore}%
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShowHints}>
                <Lightbulb className="h-4 w-4 mr-2" />
                {showHints ? 'Hide' : 'Show'} Hints
              </Button>
              <Button variant="outline" size="sm" onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
              <Button variant="outline" size="sm" onClick={onExit}>
                Exit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Hints Panel */}
      {showHints && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Expected Response Elements:</strong></p>
              <div className="flex flex-wrap gap-1">
                {scenario.scenario_data.expected_response_elements.map((element, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {element.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
              <p className="text-xs mt-2"><strong>Remember:</strong> Be empathetic, professional, and focus on the user's immediate needs.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Chat Interface */}
      <Card className="h-96">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.from === 'specialist' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.from === 'specialist' 
                    ? 'bg-primary text-primary-foreground' 
                    : message.from === 'system'
                    ? 'bg-muted text-muted-foreground text-center text-xs'
                    : 'bg-muted'
                }`}>
                  <p>{message.message}</p>
                  {message.evaluation && (
                    <div className="mt-2 text-xs opacity-90">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3" />
                        Score: {message.evaluation.score}%
                      </div>
                      {message.evaluation.elements_covered.length > 0 && (
                        <div className="text-green-200">
                          ✓ Covered: {message.evaluation.elements_covered.join(', ')}
                        </div>
                      )}
                      {message.evaluation.elements_missed.length > 0 && (
                        <div className="text-yellow-200">
                          ⚠ Missed: {message.evaluation.elements_missed.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your response as a Peer Support Specialist..."
              className="flex-1 min-h-[60px] resize-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleCompleteSession}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Session Progress</span>
              <span>{Math.min(currentStep, scenario.learning_objectives.length)}/{scenario.learning_objectives.length} objectives</span>
            </div>
            <Progress 
              value={(Math.min(currentStep, scenario.learning_objectives.length) / scenario.learning_objectives.length) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};