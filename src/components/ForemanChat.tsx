import React, { useState, useRef, useEffect } from 'react';
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
  Star,
  Wind,
  TrendingUp,
  Calendar,
  Map,
  Wrench
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserData } from '@/hooks/useUserData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import BreathingExercise from '@/components/BreathingExercise';
import UrgeTracker from '@/components/UrgeTracker';
import GratitudeLogEnhanced from '@/components/GratitudeLogEnhanced';
import { ConversationMemoryManager } from '@/utils/conversationMemory';

interface ForemanChatProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Message {
  id: number;
  sender: 'user' | 'foreman' | 'system';
  text: string;
  time: string;
  hasActions?: boolean;
  isSaved?: boolean;
  context?: string;
  recommendedTools?: string[];
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

const ForemanChat: React.FC<ForemanChatProps> = ({ onBack, onNavigate }) => {
  console.log('ForemanChat component initializing...');
  console.log('Props received:', { onBack: !!onBack, onNavigate: !!onNavigate });
  
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
  
  // Tool modal states
  const [showBreathing, setShowBreathing] = useState(false);
  const [showUrgeTracker, setShowUrgeTracker] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add error boundary for language context
  let languageContext;
  try {
    languageContext = useLanguage();
    console.log('Language context loaded successfully:', languageContext.language);
  } catch (error) {
    console.error('Language context error:', error);
    // Fallback values
    languageContext = {
      t: (key: string) => key,
      getArray: (key: string) => []
    };
  }
  const { t, getArray } = languageContext;
  
  const { userData, logActivity } = useUserData();
  console.log('User data:', userData);
  const userName = userData?.firstName || localStorage.getItem('currentUser') || 'friend';
  console.log('Using userName:', userName);

  // Initialize with personalized greeting based on conversation history
  useEffect(() => {
    console.log('Initializing greeting for user:', userName);
    
    try {
      const lastConversation = ConversationMemoryManager.getLastConversationSummary(userName);
      console.log('Last conversation summary:', lastConversation);
      
      let greeting = '';
      
      if (lastConversation && lastConversation.lastConversationDate) {
        console.log('Using contextual greeting for returning user');
        const timeSince = ConversationMemoryManager.getTimeSinceLastConversation(userName);
        const contextualGreetings = getArray('foreman.contextualGreetings');
        console.log('Contextual greetings array:', contextualGreetings);
        
        // Choose greeting type based on previous conversation
        let greetingArray = getArray('foreman.contextualGreetings.returning');
        if (timeSince.includes('day') && parseInt(timeSince) >= 7) {
          greetingArray = getArray('foreman.contextualGreetings.longGap');
        } else if (lastConversation.userEmotionalState === 'crisis') {
          greetingArray = getArray('foreman.contextualGreetings.crisisReturn');
        } else if (lastConversation.userEmotionalState === 'struggling') {
          greetingArray = getArray('foreman.contextualGreetings.strugglingReturn');
        } else if (lastConversation.userEmotionalState === 'hopeful') {
          greetingArray = getArray('foreman.contextualGreetings.hopefulReturn');
        } else if (lastConversation.toolsRecommended?.length > 0) {
          greetingArray = getArray('foreman.contextualGreetings.toolFollowUp');
        }
        
        console.log('Selected greeting array:', greetingArray);
        const greetingOptions = greetingArray.length > 0 ? greetingArray : getArray('foreman.contextualGreetings.returning');
        greeting = greetingOptions[Math.floor(Math.random() * greetingOptions.length)] || 'Hey there, how are you doing?';
        
        // Replace placeholders with actual data
        greeting = greeting.replace(/{name}/g, userName);
        greeting = greeting.replace(/{timeSince}/g, timeSince);
        greeting = greeting.replace(/{topic}/g, lastConversation.mainTopics?.[0] || 'your situation');
        greeting = greeting.replace(/{mood}/g, lastConversation.userEmotionalState);
        greeting = greeting.replace(/{tool}/g, lastConversation.toolsRecommended?.[0] || 'breathing exercise');
      } else {
        console.log('Using initial prompt for new user');
        // First time user - use initial prompts
        const initialPrompts = getArray('foreman.initialPrompts');
        console.log('Initial prompts array:', initialPrompts);
        greeting = initialPrompts.length > 0 
          ? initialPrompts[Math.floor(Math.random() * initialPrompts.length)]
          : "Hey there! What's on your mind today?";
        greeting = greeting.replace(/{name}/g, userName);
      }

      console.log('Final greeting:', greeting);

      const initialMessage: Message = {
        id: 1,
        sender: 'foreman',
        text: greeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([initialMessage]);
      console.log('Initial message set:', initialMessage);
    } catch (error) {
      console.error('Error initializing greeting:', error);
      // Fallback greeting
      const fallbackMessage: Message = {
        id: 1,
        sender: 'foreman',
        text: `Hey ${userName}, what brings you here today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([fallbackMessage]);
    }
  }, [t, userName, getArray]);


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

  // Save conversation memory when component unmounts or user leaves
  useEffect(() => {
    const saveConversationMemory = () => {
      if (messages.length > 1) { // Only save if there was actual conversation
        const conversationMessages = messages.map(msg => ({
          sender: msg.sender as 'user' | 'foreman',
          text: msg.text,
          time: msg.time
        }));
        
        const toolsUsed: string[] = [];
        // Track tools that were actually used (you could enhance this by tracking actual tool usage)
        
        ConversationMemoryManager.saveConversationSession(userName, conversationMessages, toolsUsed);
      }
    };

    // Save on component unmount
    return () => {
      saveConversationMemory();
    };
  }, [messages, userName]);

  // Also save periodically during long conversations
  useEffect(() => {
    if (messages.length > 10 && messages.length % 10 === 0) {
      const conversationMessages = messages.map(msg => ({
        sender: msg.sender as 'user' | 'foreman',
        text: msg.text,
        time: msg.time
      }));
      
      ConversationMemoryManager.saveConversationSession(userName, conversationMessages, []);
    }
  }, [messages.length, userName]);

  const getOpenAIResponse = async (userMessage: string) => {
    console.log('Getting OpenAI response for message:', userMessage);
    
    try {
      const lastConversation = ConversationMemoryManager.getLastConversationSummary(userName);
      console.log('Last conversation summary:', lastConversation);
      
      const conversationHistory = ConversationMemoryManager.getConversationHistory(userName);
      console.log('Conversation history length:', conversationHistory.length);
      
      // Get streak and journey data
      const trackingManager = (await import('@/utils/trackingManager')).trackingManager;
      const journeyCalc = await import('@/utils/journeyCalculation');
      
      const streakData = trackingManager.getStreakData();
      console.log('Streak data:', streakData);
      
      const currentJourneyDay = journeyCalc.calculateCurrentJourneyDay(userData);
      const isTodayCompleted = journeyCalc.isDayCompleted(userData, currentJourneyDay);
      console.log('Journey data - Current day:', currentJourneyDay, 'Today completed:', isTodayCompleted);
      
      const todaysStats = trackingManager.getTodaysStats();
      console.log('Today\'s stats:', todaysStats);
      
      const requestBody = {
        message: userMessage,
        conversationHistory: messages,
        userProfile: {
          firstName: userName,
          recoveryStartDate: userData?.journeyProgress?.completionDates?.[1] // Use first journey completion as start date
        },
        previousConversationSummary: lastConversation,
        previousSessions: conversationHistory.slice(0, 3), // Last 3 sessions
        streakData: {
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          lastActivityDate: streakData.lastActivityDate
        },
        journeyProgress: {
          currentDay: currentJourneyDay,
          isTodayCompleted,
          completedDays: userData?.journeyProgress?.completedDays || [],
          totalDays: 90
        },
        todaysActivity: {
          actionsToday: todaysStats.actionsToday,
          toolsUsedToday: todaysStats.toolsUsedToday,
          journeyActivitiesCompleted: todaysStats.journeyActivitiesCompleted,
          recoveryStrength: todaysStats.recoveryStrength
        }
      };
      
      console.log('🚀 Sending request to foreman-chat edge function');
      console.log('📊 Request payload summary:', {
        messageLength: requestBody.message.length,
        conversationHistoryCount: requestBody.conversationHistory.length,
        hasUserProfile: !!requestBody.userProfile,
        currentStreak: requestBody.streakData.currentStreak,
        journeyDay: requestBody.journeyProgress.currentDay,
        isTodayCompleted: requestBody.journeyProgress.isTodayCompleted
      });
      
      const requestStartTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('foreman-chat', {
        body: requestBody
      });

      const requestTime = Date.now() - requestStartTime;
      console.log('⏱️ Edge function request completed in', requestTime, 'ms');

      if (error) {
        console.error('❌ Edge function error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Edge function response received successfully');
      console.log('📝 Response details:', {
        hasResponse: !!data?.response,
        responseLength: data?.response?.length || 0,
        hasError: !!data?.error,
        recommendedToolsCount: data?.recommendedTools?.length || 0,
        recommendedTools: data?.recommendedTools || [],
        hasActions: data?.hasActions,
        needsPeerSupport: data?.needsPeerSupport
      });
      console.log('💬 Full response content:', data);
      return data;
    } catch (error) {
      console.error('❌ OpenAI/Edge function integration error:');
      console.error('🔍 Error type:', error.constructor.name);
      console.error('💥 Error message:', error.message);
      console.error('📍 Error stack:', error.stack);
      console.error('🔧 Full error object:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    console.log('handleSendMessage called with message:', message);
    
    if (message.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        sender: 'user',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      console.log('Adding user message:', userMessage);
      setMessages(prev => [...prev, userMessage]);
      
      // Classify input first for fallback system
      const inputType = classifyInput(message);
      console.log('Message classified as:', inputType);
      
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
      console.log('Updated conversation context:', newContext);
      
      const currentMessage = message;
      setMessage('');

      // Try OpenAI first, fall back to rule-based system
      try {
        console.log('🤖 Attempting to get OpenAI response for message:', currentMessage);
        const aiResponse = await getOpenAIResponse(currentMessage);
        console.log('📨 OpenAI API call completed, response:', aiResponse);
        
        if (aiResponse && aiResponse.response) {
          console.log('✅ Using AI response from OpenAI');
          console.log('🎯 AI response details:', {
            responseText: aiResponse.response,
            hasError: aiResponse.error,
            hasActions: aiResponse.hasActions,
            toolsRecommended: aiResponse.recommendedTools,
            needsPeerSupport: aiResponse.needsPeerSupport
          });
          
          // Use OpenAI response
          const foremanResponse: Message = {
            id: messages.length + 2,
            sender: 'foreman',
            text: aiResponse.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasActions: aiResponse.hasActions || false,
            recommendedTools: aiResponse.recommendedTools || []
          };
          
          console.log('💬 Adding Foreman response to messages:', foremanResponse);
          setMessages(prev => [...prev, foremanResponse]);
          
          // Show error notification if the response came from a fallback
          if (aiResponse.error) {
            console.warn('⚠️ Response came from edge function fallback due to error');
          }
        } else {
          console.error('❌ Invalid response from OpenAI - falling back to rule-based system');
          console.error('🔍 Response was:', aiResponse);
          throw new Error('No valid response from OpenAI');
        }
      } catch (error) {
        console.error('❌ OpenAI integration failed completely, using local fallback:');
        console.error('🔍 Failure reason:', error.message);
        console.error('📍 Full error:', error);
        
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
    onNavigate?.('chat');
  };

  const handleFieldStory = () => {
    const fieldStories = getArray('foreman.fieldStories');
    const story = fieldStories[Math.floor(Math.random() * fieldStories.length)];
    const storyMessage: Message = {
      id: messages.length + 1,
      sender: 'foreman',
      text: story,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasActions: true,
      recommendedTools: ['peer']
    };
    setMessages(prev => [...prev, storyMessage]);
  };

  // Tool handlers
  const handleToolAction = (tool: string) => {
    switch (tool) {
      case 'breathing':
        setShowBreathing(true);
        logActivity('Started Breathing Exercise', 'Opened breathing exercise from Foreman');
        break;
      case 'urge':
        setShowUrgeTracker(true);
        logActivity('Started Urge Tracker', 'Opened urge tracker from Foreman');
        break;
      case 'gratitude':
        setShowGratitudeLog(true);
        logActivity('Started Gratitude Log', 'Opened gratitude log from Foreman');
        break;
      case 'peer':
        handlePeerEscalation();
        break;
      case 'calendar':
        onNavigate?.('calendar');
        logActivity('Opened Recovery Calendar', 'Navigated to calendar from Foreman');
        break;
      case 'journey':
        onNavigate?.('journey');
        logActivity('Opened Recovery Journey', 'Navigated to journey from Foreman');
        break;
      case 'toolbox':
        onNavigate?.('toolbox');
        logActivity('Opened Toolbox', 'Navigated to toolbox from Foreman');
        break;
      default:
        console.warn('Unknown tool:', tool);
    }
  };

  // Tool completion handlers
  const handleToolCompletion = (toolName: string) => {
    console.log(`Tool completed: ${toolName}`);
    
    // Add a message acknowledging tool completion and redirecting to journey
    const journeyCalc = require('@/utils/journeyCalculation');
    const currentJourneyDay = journeyCalc.calculateCurrentJourneyDay(userData);
    const isTodayCompleted = journeyCalc.isDayCompleted(userData, currentJourneyDay);
    
    let redirectMessage = '';
    if (!isTodayCompleted) {
      const streakRedirects = [
        `Good work on the ${toolName}, ${userName}. Now let's keep that momentum going - have you done today's journey (day ${currentJourneyDay})?`,
        `${toolName} completed, ${userName}. That's the support work. Now for the main event - your daily journey. Day ${currentJourneyDay} done?`,
        `Nice job with ${toolName}, ${userName}. Tools help, but your streak builds with daily journey work. Today's completed?`,
        `${toolName} done, ${userName}. Now get back to building that streak - day ${currentJourneyDay} of your journey awaits.`
      ];
      redirectMessage = streakRedirects[Math.floor(Math.random() * streakRedirects.length)];
    } else {
      redirectMessage = `Good work on the ${toolName}, ${userName}. You've already completed today's journey - that's how you build a real streak.`;
    }
    
    const redirectMsg: Message = {
      id: Date.now(),
      sender: 'foreman',
      text: redirectMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, redirectMsg]);
  };

  const handleBreathingComplete = () => {
    setShowBreathing(false);
    logActivity('Completed Breathing Exercise', 'Finished breathing exercise from Foreman');
    handleToolCompletion('breathing exercise');
  };

  const handleUrgeComplete = () => {
    setShowUrgeTracker(false);
    logActivity('Completed Urge Tracker', 'Finished urge tracking from Foreman');
    handleToolCompletion('urge tracker');
  };

  const handleGratitudeComplete = () => {
    setShowGratitudeLog(false);
    logActivity('Completed Gratitude Log', 'Added gratitude entry from Foreman');
    handleToolCompletion('gratitude log');
  };

  // Get tool button configuration
  const getToolButtonConfig = (tool: string) => {
    switch (tool) {
      case 'breathing':
        return { icon: Wind, label: 'Breathing Exercise', variant: 'outline' as const };
      case 'urge':
        return { icon: TrendingUp, label: 'Urge Tracker', variant: 'outline' as const };
      case 'gratitude':
        return { icon: Heart, label: 'Gratitude Log', variant: 'outline' as const };
      case 'peer':
        return { icon: Users, label: 'Talk to Peer', variant: 'default' as const };
      case 'calendar':
        return { icon: Calendar, label: 'Recovery Calendar', variant: 'outline' as const };
      case 'journey':
        return { icon: Map, label: 'Recovery Journey', variant: 'outline' as const };
      case 'toolbox':
        return { icon: Wrench, label: 'Full Toolbox', variant: 'outline' as const };
      default:
        return { icon: Star, label: tool, variant: 'outline' as const };
    }
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

            {/* Dynamic action buttons for Foreman messages */}
            {msg.sender === 'foreman' && msg.hasActions && (
              <div className="flex justify-start mt-2">
                <div className="flex flex-wrap gap-2">
                  {/* Always show save wisdom button */}
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
                  
                  {/* Dynamic tool buttons based on AI recommendations */}
                  {msg.recommendedTools?.map((tool, index) => {
                    const config = getToolButtonConfig(tool);
                    const Icon = config.icon;
                    
                    return (
                      <Button
                        key={index}
                        size="sm"
                        variant={config.variant}
                        onClick={() => handleToolAction(tool)}
                        className={`${
                          config.variant === 'default' 
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                            : 'border-border text-card-foreground hover:bg-accent'
                        } text-xs font-source`}
                      >
                        <Icon size={14} className="mr-1" />
                        {config.label}
                      </Button>
                    );
                  })}
                  
                  {/* Field story button if no specific tools recommended */}
                  {(!msg.recommendedTools || msg.recommendedTools.length === 0) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFieldStory}
                      className="border-border text-card-foreground hover:bg-accent text-xs font-source"
                    >
                      {t('foreman.actions.fieldStory')}
                    </Button>
                  )}
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

      {/* Tool Modals */}
      {showBreathing && (
        <BreathingExercise 
          onClose={handleBreathingComplete}
          onCancel={() => setShowBreathing(false)}
        />
      )}

      {showUrgeTracker && (
        <UrgeTracker 
          onClose={handleUrgeComplete}
          onCancel={() => setShowUrgeTracker(false)}
          onNavigate={onNavigate}
        />
      )}

      {showGratitudeLog && (
        <GratitudeLogEnhanced 
          onClose={handleGratitudeComplete}
          onCancel={() => setShowGratitudeLog(false)}
        />
      )}
    </div>
  );
};

export default ForemanChat;
