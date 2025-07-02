
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
  Users
} from 'lucide-react';

interface ForemanChatProps {
  onBack: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'foreman';
  text: string;
  time: string;
  affirmationId?: number;
  isSaved?: boolean;
}

const ForemanChat = ({ onBack }: ForemanChatProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'foreman',
      text: "Hey there, partner. I'm The Foreman - think of me as that wise old-timer on the job site who's got your back. What's on your mind today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [savedAffirmations, setSavedAffirmations] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recovery-focused affirmations with mixed tone
  const affirmations = [
    "Recovery isn't about being perfect - it's about being present for your life.",
    "Every day you choose sobriety, you're choosing strength over surrender.",
    "Your past doesn't define you, but your next choice can redefine everything.",
    "Healing happens one honest conversation at a time, starting with yourself.",
    "You didn't come this far to only come this far - keep building.",
    "The courage to get help is the same courage that will carry you through.",
    "Your recovery story is someone else's hope for tomorrow.",
    "Sobriety isn't what you give up - it's everything you gain back.",
    "Every sunrise is proof that you can start again.",
    "The hardest battles are fought in silence, but you don't have to fight alone.",
    "Progress isn't perfect, but it's always worth celebrating.",
    "Your willingness to change is the foundation everything else builds on.",
    "Recovery is the daily practice of choosing yourself over your addiction.",
    "You're not broken - you're breaking free.",
    "The person you're becoming is worth every difficult day.",
    "Strength isn't avoiding the struggle - it's walking through it with purpose.",
    "Your recovery journey is sacred work, and you're exactly where you need to be.",
    "Sobriety gives you back the gift of feeling everything, including joy.",
    "Every meeting attended, every call made, every day sober is a victory.",
    "You have survived 100% of your worst days - that's an undefeated record.",
    "Recovery is like learning to walk again, and you're getting stronger with each step.",
    "The same power that got you through yesterday lives inside you today.",
    "Your commitment to sobriety is your commitment to your future self.",
    "Healing isn't linear, but it's always moving you toward wholeness.",
    "You're rewriting your story one sober day at a time.",
    "The tools you're building in recovery will serve you for life.",
    "Your recovery ripples out to touch everyone who loves you.",
    "Addiction told you lies - recovery shows you the truth of who you are.",
    "Every craving you overcome makes you stronger for the next one.",
    "You're not just getting clean - you're getting your life back.",
    "Recovery is the bridge between who you were and who you're meant to be.",
    "Your vulnerability in asking for help is actually your greatest strength.",
    "Sobriety isn't punishment - it's the key to your freedom.",
    "The work you're doing today is planting seeds for tomorrow's harvest.",
    "You have everything inside you that you need to stay sober today.",
    "Recovery teaches you that rock bottom can become your foundation.",
    "Your decision to get sober was the beginning of your best life.",
    "Every day in recovery is a day your future self will thank you for.",
    "You're not just surviving your addiction - you're transforming through it.",
    "The path of recovery leads to places addiction never could.",
    "Your sobriety is a gift you give yourself every single day.",
    "Recovery is proof that second chances can become your greatest success.",
    "You're building a life so good that you don't need to escape from it.",
    "Every support meeting is a reminder that you're never fighting alone.",
    "Your recovery is evidence that change is always possible.",
    "Sobriety clears the fog so you can see how bright your light really shines.",
    "The courage to face your addiction is the same courage that will heal you.",
    "You're not going back to who you were - you're becoming who you're meant to be.",
    "Recovery is your daily practice of loving yourself back to life.",
    "Your commitment to sobriety is your commitment to hope."
  ];

  const getRandomAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    return {
      id: randomIndex,
      text: affirmations[randomIndex]
    };
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
      setMessage('');

      // Generate Foreman response
      setTimeout(() => {
        const affirmation = getRandomAffirmation();
        const foremanResponse: Message = {
          id: messages.length + 2,
          sender: 'foreman',
          text: affirmation.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          affirmationId: affirmation.id
        };

        setMessages(prev => [...prev, foremanResponse]);
      }, 1000);
    }
  };

  const handleSaveAffirmation = (affirmationId: number) => {
    if (!savedAffirmations.includes(affirmationId)) {
      setSavedAffirmations(prev => [...prev, affirmationId]);
      
      // Add confirmation message
      const confirmMessage: Message = {
        id: messages.length + 1,
        sender: 'foreman',
        text: "Added to your Tool Belt. Smart thinking, partner.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const handlePeerEscalation = () => {
    // In a real app, this would navigate to peer chat
    window.location.href = 'sms:+14327018678?body=I need to talk to a peer specialist.';
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Voice recognition would be implemented here
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-industrial">
      {/* Header */}
      <div className="bg-midnight/90 backdrop-blur-sm border-b border-steel-dark p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-steel-light hover:text-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="w-12 h-12 bg-steel rounded-full flex items-center justify-center">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-oswald font-semibold text-white">The Foreman</h2>
              <p className="text-steel-light text-sm">Your AI Recovery Mentor</p>
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
                  ? 'bg-steel text-white' 
                  : 'bg-white/10 backdrop-blur-sm text-white'
              } rounded-2xl p-4`}>
                <p className="text-sm leading-relaxed mb-1">{msg.text}</p>
                <p className={`text-xs ${
                  msg.sender === 'user' ? 'text-white/70' : 'text-steel-light'
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>

            {/* Action buttons for Foreman messages with affirmations */}
            {msg.sender === 'foreman' && msg.affirmationId !== undefined && (
              <div className="flex justify-start mt-2">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveAffirmation(msg.affirmationId!)}
                    className={`border-steel text-steel-light hover:text-white hover:bg-steel/20 ${
                      savedAffirmations.includes(msg.affirmationId!) ? 'bg-steel/20' : ''
                    }`}
                  >
                    <Bookmark size={14} />
                    <span className="text-xs">Tool Belt</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePeerEscalation}
                    className="bg-construction hover:bg-construction-dark text-midnight text-xs font-oswald"
                  >
                    <Users size={14} className="mr-1" />
                    Talk to a Peer
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-midnight/90 backdrop-blur-sm border-t border-steel-dark p-4">
        <div className="flex space-x-3">
          <Button
            size="icon"
            variant="outline"
            onClick={toggleListening}
            className={`border-steel ${
              isListening 
                ? 'bg-construction text-midnight' 
                : 'text-steel-light hover:text-white hover:bg-steel/20'
            }`}
          >
            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell The Foreman what's on your mind..."
            className="flex-1 bg-white/10 border-steel-dark text-white placeholder:text-steel-light"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-steel hover:bg-steel-light text-white px-6"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForemanChat;
