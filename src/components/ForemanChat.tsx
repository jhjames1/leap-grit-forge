
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
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [currentAffirmationId, setCurrentAffirmationId] = useState<number | null>(null);
  const [savedAffirmations, setSavedAffirmations] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Preloaded affirmations
  const affirmations = {
    toughLove: [
      "Even steel breaks under pressure. What matters is how you weld it back.",
      "You don't quit on a tough job. You double down and finish it clean.",
      "Stop making excuses and start making progress. You're tougher than this.",
      "Pain is temporary, but quitting lasts forever. Keep pushing.",
      "You've survived 100% of your worst days so far. Today won't be different.",
      "Real strength isn't avoiding the fall - it's getting back up every damn time.",
      "The only way out is through. So suit up and get moving.",
      "You're not built to break. You're built to bend and bounce back stronger.",
      "Every champion has scars. Yours are proof you're still fighting.",
      "Comfort zones are for quitters. Step outside and claim your ground.",
      "You didn't come this far to only come this far. Finish what you started.",
      "The weight you're carrying will either crush you or build you. Choose wisely.",
      "Stop waiting for perfect conditions. Good enough conditions are enough.",
      "Your excuses expire today. Your potential doesn't.",
      "Pressure makes diamonds. You're under pressure for a reason."
    ],
    spiritual: [
      "Grace doesn't make you weak. It makes you dangerous to your demons.",
      "Even the strongest oak was once just an acorn that held its ground.",
      "Your journey isn't about perfection - it's about purpose.",
      "Every sunset promises a new dawn. Today's struggles end with today.",
      "The same God who calms storms lives inside you.",
      "You're not walking this path alone. There's strength in surrender.",
      "Faith isn't the absence of fear - it's courage in spite of it.",
      "Your scars tell a story of survival, not defeat.",
      "Sometimes the bravest thing you can do is ask for help.",
      "You are more than your mistakes. You are beloved, period.",
      "Healing happens one breath, one choice, one day at a time.",
      "The light inside you is stronger than any darkness around you.",
      "Forgiveness isn't weakness - it's the ultimate power move.",
      "You were created for more than just surviving. You were made to thrive.",
      "Trust the process, even when you can't see the whole staircase."
    ],
    shortSharp: [
      "One right choice is enough to shift the whole day.",
      "Breathe. Stand. Move forward. That's winning today.",
      "Progress over perfection. Always.",
      "You've got this. Period.",
      "Small steps still move mountains.",
      "Today you choose strength.",
      "Setbacks are setups for comebacks.",
      "Your comeback starts now.",
      "Tough times don't last. Tough people do.",
      "Rise up. Show up. Never give up."
    ],
    general: [
      "Every professional started as an amateur. You're learning, not failing.",
      "The tools in your belt are only as good as the hands that use them.",
      "Consistency beats intensity every single time.",
      "You don't have to be perfect. You just have to be present.",
      "Recovery is a job site - you show up every day and do the work.",
      "Your past doesn't define your future. Your choices today do.",
      "Strength isn't measured by what you can lift, but by what you can overcome.",
      "Every master craftsman was once a disaster. Keep building.",
      "The foundation you're laying today will support tomorrow's victories.",
      "You're not behind in life. You're exactly where you need to be."
    ]
  };

  const getAllAffirmations = () => {
    return [
      ...affirmations.toughLove.map((text, index) => ({ id: index, text, type: 'toughLove' })),
      ...affirmations.spiritual.map((text, index) => ({ id: index + 15, text, type: 'spiritual' })),
      ...affirmations.shortSharp.map((text, index) => ({ id: index + 30, text, type: 'shortSharp' })),
      ...affirmations.general.map((text, index) => ({ id: index + 40, text, type: 'general' }))
    ];
  };

  const getRandomAffirmation = (style?: string) => {
    const allAffirmations = getAllAffirmations();
    let pool = allAffirmations;
    
    if (style && style !== 'general') {
      pool = allAffirmations.filter(aff => aff.type === style);
    }
    
    const randomAffirmation = pool[Math.floor(Math.random() * pool.length)];
    return randomAffirmation;
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
        setCurrentAffirmationId(affirmation.id);
        setShowStyleOptions(true);
      }, 1000);
    }
  };

  const handleStyleRequest = (style: string) => {
    const affirmation = getRandomAffirmation(style);
    const styleResponse: Message = {
      id: messages.length + 1,
      sender: 'foreman',
      text: affirmation.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      affirmationId: affirmation.id
    };

    setMessages(prev => [...prev, styleResponse]);
    setCurrentAffirmationId(affirmation.id);
    setShowStyleOptions(false);
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
            {msg.sender === 'foreman' && msg.affirmationId && (
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
                </div>
              </div>
            )}
        ))}

        {/* Style Options */}
        {showStyleOptions && (
          <div className="flex justify-start">
            <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4 max-w-[85%]">
              <p className="text-white text-sm mb-3">Want a different style?</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStyleRequest('toughLove')}
                  className="bg-steel hover:bg-steel-light text-white text-xs"
                >
                  Tough Love
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStyleRequest('spiritual')}
                  className="bg-steel hover:bg-steel-light text-white text-xs"
                >
                  Spiritual
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStyleRequest('shortSharp')}
                  className="bg-steel hover:bg-steel-light text-white text-xs"
                >
                  Short & Sharp
                </Button>
              </div>
              <div className="mt-3 pt-3 border-t border-steel-dark">
                <Button
                  size="sm"
                  onClick={handlePeerEscalation}
                  className="bg-construction hover:bg-construction-dark text-midnight text-xs font-oswald"
                >
                  <Users size={14} className="mr-1" />
                  Talk to a Peer Instead
                </Button>
              </div>
            </Card>
          </div>
        )}

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
