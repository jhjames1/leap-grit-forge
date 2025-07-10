import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  ArrowLeft, 
  Heart, 
  Bookmark,
  MessageCircle,
  Mic,
  MicOff,
  Users,
  Star
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ForemanChatProps {
  onBack: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'foreman';
  text: string;
  time: string;
  hasActions?: boolean;
  isSaved?: boolean;
  context?: string;
}

interface ConversationContext {
  lastUserMessage: string;
  mood: 'struggling' | 'hopeful' | 'frustrated' | 'neutral';
  topics: string[];
  sessionLength: number;
}

const ForemanChat = ({ onBack }: ForemanChatProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [savedAffirmations, setSavedAffirmations] = useState<number[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    lastUserMessage: '',
    mood: 'neutral',
    topics: [],
    sessionLength: 0
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Initialize with time-sensitive greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = t('foreman.greeting.morning');
    } else if (hour < 17) {
      greeting = t('foreman.greeting.afternoon');
    } else {
      greeting = t('foreman.greeting.evening');
    }

    const initialMessage: Message = {
      id: 1,
      sender: 'foreman',
      text: greeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([initialMessage]);
  }, [t]);  // Add t dependency to refresh when language changes

  // Recovery-focused response templates
  const responseTemplates = {
    struggling: [
      "I've seen concrete crack under pressure. Doesn't mean the whole foundation's gone. Let's figure out where it's weak and fix it.",
      "Even the strongest steel bends before it breaks. You're still standing—that's what matters.",
      "Bad days don't build bad lives. You're here, you're talking—that's step one."
    ],
    hopeful: [
      "That's the spirit I like to hear. Keep that momentum going.",
      "You're building something solid here. One good choice at a time.",
      "Sounds like you're finding your footing. Stay with that feeling."
    ],
    frustrated: [
      "Frustration means you care. Channel that energy into something that moves you forward.",
      "Sometimes you gotta tear down the old framework to build something better.",
      "I get it. But anger without action is just noise. What's your next move?"
    ],
    relapse: [
      "You came back. That's step one. Now let's figure out what led you there so we don't repeat the same loop.",
      "One slip doesn't tear down the whole job. We assess, we adjust, we keep building.",
      "The fact you're here telling me means you're not giving up. That's what counts."
    ],
    neutral: [
      "I hear you. What's the next right thing you can do?",
      "Every job has tough moments. What matters is how you handle them.",
      "You're talking to me instead of giving up. That's already a win."
    ]
  };

  const fieldStories = [
    "One time we drilled 300 feet through the wrong strata. Cost us two days. We still finished the job—and did it cleaner the second time.",
    "I once watched a guy rebuild an entire foundation after it failed inspection. Took twice as long, but it's still standing 20 years later.",
    "Had a crew that kept making the same mistake. Finally had to stop, retrain, start over. Best decision we made that year."
  ];

  const followUpPrompts = [
    "Want to talk more about that?",
    "Need a stronger push?",
    "Want a field story for perspective?",
    "Rather talk to a Peer?"
  ];

  const reflectiveQuestions = [
    "What's been the hardest part of today?",
    "When was the last time you felt proud of how you handled something?",
    "Are you avoiding something—or facing it head on?",
    "What's got you shut down? You trying to push through, or hide from it?"
  ];

  const analyzeMood = (text: string): 'struggling' | 'hopeful' | 'frustrated' | 'neutral' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('give up') || lowerText.includes('hopeless') || lowerText.includes('can\'t') || lowerText.includes('failed')) {
      return 'struggling';
    }
    if (lowerText.includes('good') || lowerText.includes('better') || lowerText.includes('proud') || lowerText.includes('strong')) {
      return 'hopeful';
    }
    if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('mad') || lowerText.includes('pissed')) {
      return 'frustrated';
    }
    
    return 'neutral';
  };

  const generateContextualResponse = (userMessage: string, context: ConversationContext): string => {
    const mood = analyzeMood(userMessage);
    const lowerMessage = userMessage.toLowerCase();
    
    // Get translated responses based on mood
    const moodResponses = t('foreman.responses.' + mood);
    
    // Handle specific recovery-related topics
    if (lowerMessage.includes('drank') || lowerMessage.includes('used') || lowerMessage.includes('relapsed')) {
      return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }
    
    // Handle tone adjustment requests
    if (lowerMessage.includes('tougher') || lowerMessage.includes('stronger') || lowerMessage.includes('tough love')) {
      return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }
    
    // Handle feeling words
    if (lowerMessage.includes('numb') || lowerMessage.includes('empty')) {
      return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }
    
    // Use mood-based responses
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        sender: 'user',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, userMessage]);
      
      // Update conversation context
      const newContext: ConversationContext = {
        lastUserMessage: message,
        mood: analyzeMood(message),
        topics: [...conversationContext.topics, message],
        sessionLength: conversationContext.sessionLength + 1
      };
      setConversationContext(newContext);
      
      setMessage('');

      // Generate contextual response
      setTimeout(() => {
        const responseText = generateContextualResponse(message, newContext);
        
        const foremanResponse: Message = {
          id: messages.length + 2,
          sender: 'foreman',
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hasActions: true
        };

        setMessages(prev => [...prev, foremanResponse]);
        
        // Sometimes ask follow-up questions
        if (Math.random() < 0.3 && newContext.sessionLength > 2) {
          setTimeout(() => {
            const followUpQuestion = reflectiveQuestions[Math.floor(Math.random() * reflectiveQuestions.length)];
            const followUpMessage: Message = {
              id: messages.length + 3,
              sender: 'foreman',
              text: followUpQuestion,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              hasActions: true
            };
            setMessages(prev => [...prev, followUpMessage]);
          }, 2000);
        }
      }, 1000);
    }
  };

  const handleSaveMessage = (messageId: number) => {
    if (!savedAffirmations.includes(messageId)) {
      setSavedAffirmations(prev => [...prev, messageId]);
      
      const confirmMessage: Message = {
        id: messages.length + 1,
        sender: 'foreman',
        text: "Added to your Tool Belt. Smart thinking.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const handlePeerEscalation = () => {
    window.location.href = 'sms:+14327018678?body=I need to talk to a peer specialist.';
  };

  const handleFieldStory = () => {
    const fieldStories = t('foreman.fieldStories');
    const story = fieldStories[Math.floor(Math.random() * fieldStories.length)];
    const storyMessage: Message = {
      id: messages.length + 1,
      sender: 'foreman',
      text: story,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasActions: true
    };
    setMessages(prev => [...prev, storyMessage]);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 border-0 shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-card-foreground"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h2 className="font-fjalla font-bold text-card-foreground">{t('foreman.title')}</h2>
              <p className="text-muted-foreground text-sm font-source">{t('foreman.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-card-foreground border-0 shadow-none'
              } rounded-2xl p-4`}>
                <p className="text-sm leading-relaxed mb-1 font-source">{msg.text}</p>
                <p className={`text-xs font-source ${
                  msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>

            {/* Action buttons for Foreman messages */}
            {msg.sender === 'foreman' && msg.hasActions && (
              <div className="flex justify-start mt-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveMessage(msg.id)}
                    className={`border-border text-card-foreground hover:bg-accent font-source ${
                      savedAffirmations.includes(msg.id) ? 'bg-accent' : ''
                    }`}
                  >
                    <Star size={14} />
                    <span className="text-xs">{t('foreman.actions.toolBelt')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFieldStory}
                    className="border-border text-card-foreground hover:bg-accent text-xs font-source"
                  >
                    {t('foreman.actions.fieldStory')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePeerEscalation}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-source"
                  >
                    <Users size={14} className="mr-1" />
                    {t('foreman.actions.talkToPeer')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4 border-0 shadow-none">
        <div className="flex space-x-3">
          <Button
            size="icon"
            variant="outline"
            onClick={toggleListening}
            className={`border-border ${
              isListening 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-card-foreground hover:bg-accent'
            }`}
          >
            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('foreman.placeholder')}
            className="flex-1 bg-background border-border text-card-foreground placeholder:text-muted-foreground"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForemanChat;
