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
import { useUserData } from '@/hooks/useUserData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ForemanChatProps {
  onBack: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'foreman' | 'system';
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
  conversationTurn: number;
  userMessages: string[];
  invalidInputCount: number;
}

type InputType = 'valid' | 'incomprehensible' | 'belligerent' | 'minimal' | 'off-topic';

const ForemanChat = ({ onBack }: ForemanChatProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [savedAffirmations, setSavedAffirmations] = useState<number[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    lastUserMessage: '',
    mood: 'neutral',
    topics: [],
    sessionLength: 0,
    conversationTurn: 0,
    userMessages: [],
    invalidInputCount: 0
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, getArray } = useLanguage();
  const { userData } = useUserData();
  const userName = userData?.firstName || localStorage.getItem('currentUser') || 'friend';

  // Initialize with direct, provocative greeting
  useEffect(() => {
    const initialPrompts = getArray('foreman.initialPrompts');
    let greeting = initialPrompts[Math.floor(Math.random() * initialPrompts.length)];
    
    // Personalize the greeting with the user's name
    greeting = greeting.replace(/{name}/g, userName);

    const initialMessage: Message = {
      id: 1,
      sender: 'foreman',
      text: greeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([initialMessage]);
  }, [t, userName]);


  const classifyInput = (text: string): InputType => {
    const trimmed = text.trim();
    const lowerText = trimmed.toLowerCase();
    
    // Check for incomprehensible input
    if (trimmed.length === 0) return 'minimal';
    if (trimmed.length < 3 && !['yes', 'no', 'ok'].includes(lowerText)) return 'minimal';
    if (/^[^a-zA-Z]*$/.test(trimmed) && trimmed.length > 0) return 'incomprehensible'; // Only symbols/numbers
    if ((/[a-zA-Z]/.test(trimmed) && trimmed.split(/\s+/).length > 3 && 
         trimmed.split('').filter(c => /[a-zA-Z]/.test(c)).length / trimmed.length < 0.4)) {
      return 'incomprehensible'; // Too many non-letters for meaningful text
    }
    
    // Check for belligerent behavior
    const profanity = ['fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap'];
    const threats = ['kill', 'die', 'hurt', 'destroy', 'hate you', 'screw you'];
    const aggressive = ['shut up', 'stupid', 'idiot', 'worthless', 'useless'];
    
    if (profanity.some(word => lowerText.includes(word)) || 
        threats.some(word => lowerText.includes(word)) ||
        aggressive.some(word => lowerText.includes(word))) {
      return 'belligerent';
    }
    
    // Check for off-topic content (very basic check)
    const recoveryKeywords = ['recovery', 'sober', 'clean', 'urge', 'craving', 'support', 'struggle', 'help', 'therapy', 'addiction'];
    const personalKeywords = ['feel', 'think', 'want', 'need', 'can', 'will', 'should', 'trying', 'working'];
    
    if (trimmed.length > 20 && 
        !recoveryKeywords.some(word => lowerText.includes(word)) &&
        !personalKeywords.some(word => lowerText.includes(word)) &&
        (lowerText.includes('weather') || lowerText.includes('sports') || lowerText.includes('politics'))) {
      return 'off-topic';
    }
    
    return 'valid';
  };

  const generateSpecialResponse = (inputType: InputType, count: number): string => {
    const clarificationResponses = [
      "Come again? I didn't catch that.",
      "Can you run that by me again?",
      "I'm not following. Try me again.",
      "Say what now? Speak clear."
    ];
    
    const belligerentResponses = [
      "I hear you're frustrated. Let's take this down a notch.",
      "That anger's real, but let's channel it better. What's really eating at you?",
      "I've been cursed out before. What's the real problem here?",
      "Easy there, tiger. What's got you all fired up?"
    ];
    
    const offTopicResponses = [
      "Let's keep this about your recovery. What's really on your mind?",
      "That's not my wheelhouse. What's going on with you today?",
      "Stay focused on what matters - your journey. Talk to me about that.",
      "Nice try changing the subject. What's really happening with you?"
    ];

    const minimalResponses = [
      "Give me more than that. What's really going on?",
      "Come on, talk to me. What's eating at you?",
      "I need more to work with here. Open up.",
      "Don't give me the silent treatment. What's up?"
    ];

    switch (inputType) {
      case 'incomprehensible':
        if (count >= 2) return "Look, I need you to speak plainly. What's really going on? If you need help, I'm here.";
        return clarificationResponses[Math.floor(Math.random() * clarificationResponses.length)];
      
      case 'belligerent':
        if (count >= 2) return "We're not getting anywhere like this. You came here for a reason. Want to talk to a peer instead?";
        return belligerentResponses[Math.floor(Math.random() * belligerentResponses.length)];
      
      case 'off-topic':
        if (count >= 2) return "I'm here to help with your recovery, not chat about everything else. Focus up - what do you need?";
        return offTopicResponses[Math.floor(Math.random() * offTopicResponses.length)];
      
      case 'minimal':
        if (count >= 2) return "This isn't working if you won't talk. What brought you here today?";
        return minimalResponses[Math.floor(Math.random() * minimalResponses.length)];
      
      default:
        return "Something's not right. Let's start over - what's on your mind?";
    }
  };

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
    const turn = context.conversationTurn;
    
    // Turn 1: Dig deeper based on user's response
    if (turn === 1) {
      const followUp1 = getArray('foreman.followUp1');
      return followUp1[Math.floor(Math.random() * followUp1.length)];
    }
    
    // Turn 2: Validate/confirm with tough love
    if (turn === 2) {
      const followUp2 = getArray('foreman.followUp2');
      return followUp2[Math.floor(Math.random() * followUp2.length)];
    }
    
    // Turn 3+: Tool suggestions and deeper responses
    if (turn >= 3) {
      // Determine appropriate tool suggestion based on content
      const lowerMessage = userMessage.toLowerCase();
      const allMessages = context.userMessages.join(' ').toLowerCase();
      
      if (allMessages.includes('anxious') || allMessages.includes('panic') || allMessages.includes('breathe')) {
        return t('foreman.toolSuggestions.breathingRoom');
      }
      if (allMessages.includes('urge') || allMessages.includes('craving') || allMessages.includes('want to')) {
        return t('foreman.toolSuggestions.urgeTracker');
      }
      if (allMessages.includes('alone') || allMessages.includes('isolated') || allMessages.includes('nobody')) {
        return t('foreman.toolSuggestions.peerChat');
      }
      if (allMessages.includes('negative') || allMessages.includes('nothing good') || allMessages.includes('hopeless')) {
        return t('foreman.toolSuggestions.gratitude');
      }
      if (allMessages.includes('weak') || allMessages.includes('failing') || allMessages.includes('progress')) {
        return t('foreman.toolSuggestions.strengthMeter');
      }
      
      // Default tool suggestion based on mood
      if (mood === 'struggling') return t('foreman.toolSuggestions.peerChat');
      if (mood === 'frustrated') return t('foreman.toolSuggestions.breathingRoom');
      if (mood === 'hopeful') return t('foreman.toolSuggestions.strengthMeter');
      return t('foreman.toolSuggestions.gratitude');
    }
    
    // Fallback to mood-based responses
    const moodResponses = getArray('foreman.responses.' + mood);
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getOpenAIResponse = async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('foreman-chat', {
        body: {
          message: userMessage,
          conversationHistory: messages,
          userProfile: {
            firstName: userName
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        sender: 'user',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, userMessage]);
      
      // Classify input first for fallback system
      const inputType = classifyInput(message);
      
      // Update conversation context
      const newInvalidCount = inputType !== 'valid' ? conversationContext.invalidInputCount + 1 : 0;
      const newContext: ConversationContext = {
        lastUserMessage: message,
        mood: inputType === 'valid' ? analyzeMood(message) : conversationContext.mood,
        topics: inputType === 'valid' ? [...conversationContext.topics, message] : conversationContext.topics,
        sessionLength: conversationContext.sessionLength + 1,
        conversationTurn: conversationContext.conversationTurn + 1,
        userMessages: inputType === 'valid' ? [...conversationContext.userMessages, message] : conversationContext.userMessages,
        invalidInputCount: newInvalidCount
      };
      setConversationContext(newContext);
      
      const currentMessage = message;
      setMessage('');

      // Try OpenAI first, fall back to rule-based system
      try {
        const aiResponse = await getOpenAIResponse(currentMessage);
        
        if (aiResponse && aiResponse.response) {
          // Use OpenAI response
          const foremanResponse: Message = {
            id: messages.length + 2,
            sender: 'foreman',
            text: aiResponse.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasActions: aiResponse.hasActions || false
          };

          setMessages(prev => [...prev, foremanResponse]);
        } else {
          throw new Error('No response from OpenAI');
        }
      } catch (error) {
        console.error('OpenAI failed, using fallback:', error);
        
        // Fallback to rule-based system
        setTimeout(() => {
          let responseText: string;
          let hasActions = false;

          if (inputType !== 'valid') {
            responseText = generateSpecialResponse(inputType, newInvalidCount);
            // Offer peer escalation after multiple invalid inputs
            if (newInvalidCount >= 3) {
              hasActions = true;
            }
          } else {
            responseText = generateContextualResponse(currentMessage, newContext);
            hasActions = newContext.conversationTurn >= 3;
          }
          
          const foremanResponse: Message = {
            id: messages.length + 2,
            sender: 'foreman',
            text: responseText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasActions
          };

          setMessages(prev => [...prev, foremanResponse]);
        }, 1000);
      }
    }
  };

  const handleSaveMessage = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !userName) return;

    const { SavedWisdomManager } = require('@/utils/savedWisdom');
    const category = SavedWisdomManager.categorizeMessage(message.text);
    
    const success = SavedWisdomManager.saveWisdom({
      messageId,
      text: message.text,
      category,
      username: userName
    });

    if (success) {
      setSavedAffirmations([...savedAffirmations, messageId]);
      toast.success(t('foreman.wisdomSaved'));
    } else {
      toast.error(t('foreman.wisdomSaveError'));
    }
  };

  const handlePeerEscalation = () => {
    window.location.href = 'sms:+14327018678?body=I need to talk to a peer specialist.';
  };

  const handleFieldStory = () => {
    const fieldStories = getArray('foreman.fieldStories');
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
                    <span className="text-xs">{t('foreman.actions.saveWisdom')}</span>
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
