import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Phone, 
  Video, 
  Calendar, 
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';
import PeerSelection from './PeerSelection';

interface PeerChatProps {
  onBack?: () => void;
}

const PeerChat = ({ onBack }: PeerChatProps) => {
  const [currentView, setCurrentView] = useState<'selection' | 'chat'>('selection');
  const [selectedPeer, setSelectedPeer] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Load user-specific chat history when peer is selected
  useEffect(() => {
    if (selectedPeer && currentView === 'chat') {
      const currentUser = localStorage.getItem('currentUser') || 'User';
      const chatKey = `chat_${currentUser}_${selectedPeer.id}`;
      const savedMessages = localStorage.getItem(chatKey);
      
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Start with a clean slate for new conversations
        setMessages([]);
        
        if (selectedPeer.isOfflineMessage) {
          const offlineMessage = {
            id: Date.now(),
            sender: 'system',
            text: `${selectedPeer.name} is currently offline. Your message will be delivered when they're available.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false
          };
          setMessages([offlineMessage]);
        }
      }
    }
  }, [selectedPeer, currentView]);

  // Save messages when they change
  useEffect(() => {
    if (selectedPeer && messages.length > 0) {
      const currentUser = localStorage.getItem('currentUser') || 'User';
      const chatKey = `chat_${currentUser}_${selectedPeer.id}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, selectedPeer]);

  const handleSelectPeer = (peer: any) => {
    setSelectedPeer(peer);
    setCurrentView('chat');
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: 'user',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Simulate typing indicator for peer response
      if (selectedPeer?.status === 'online') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    }
  };

  const handlePhoneCall = () => {
    if (selectedPeer?.status === 'online') {
      window.location.href = 'tel:+14327018678';
    } else {
      alert('This specialist is not available for calls right now.');
    }
  };

  const handleVideoCall = () => {
    if (selectedPeer?.status === 'online') {
      window.open('https://meet.google.com/new', '_blank');
    } else {
      alert('This specialist is not available for video calls right now.');
    }
  };

  if (currentView === 'selection') {
    return (
      <PeerSelection 
        onBack={onBack || (() => {})} 
        onSelectPeer={handleSelectPeer} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-industrial">
      {/* Header */}
      <div className="bg-midnight/90 backdrop-blur-sm border-b border-steel-dark p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('selection')}
              className="text-steel-light hover:text-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="w-10 h-10 bg-steel rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <div>
              <h2 className="font-oswald font-semibold text-white">{selectedPeer?.name || 'Peer Specialist'}</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${selectedPeer?.status === 'online' ? 'bg-green-500' : selectedPeer?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                <p className="text-steel-light text-sm">
                  {selectedPeer?.status === 'online' ? 'Online' : selectedPeer?.status === 'away' ? 'Away' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              onClick={handlePhoneCall}
              disabled={selectedPeer?.status !== 'online'}
            >
              <Phone size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              onClick={handleVideoCall}
              disabled={selectedPeer?.status !== 'online'}
            >
              <Video size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-steel/10 border-b border-steel/20 p-3">
        <div className="flex items-center space-x-2 text-steel-light">
          <Shield size={16} />
          <span className="text-sm font-oswald">Secure & Confidential Chat</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
              msg.sender === 'user' 
                ? 'bg-steel text-white' 
                : msg.sender === 'system'
                ? 'bg-construction/20 text-construction border border-construction/30'
                : 'bg-white/10 backdrop-blur-sm text-white'
            } rounded-2xl p-4`}>
              <p className="text-sm leading-relaxed mb-1">{msg.text}</p>
              <p className={`text-xs ${
                msg.sender === 'user' ? 'text-white/70' : msg.sender === 'system' ? 'text-construction/70' : 'text-steel-light'
              }`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl p-4">
              <p className="text-sm text-steel-light italic">{selectedPeer?.name} is typing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2">
        <div className="flex space-x-2 overflow-x-auto">
          <Badge className="bg-steel text-white font-oswald whitespace-nowrap">
            Need Support
          </Badge>
          <Badge className="bg-steel text-white font-oswald whitespace-nowrap">
            Feeling Triggered
          </Badge>
          <Badge className="bg-steel text-white font-oswald whitespace-nowrap">
            Good Day Today
          </Badge>
          <Badge className="bg-steel text-white font-oswald whitespace-nowrap">
            Question
          </Badge>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-midnight/90 backdrop-blur-sm border-t border-steel-dark p-4">
        <div className="flex space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
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

      {/* Scheduled Check-in Banner */}
      {selectedPeer?.status === 'online' && (
        <div className="absolute top-20 left-4 right-4 bg-steel/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <Calendar className="text-white" size={16} />
            <div className="flex-1">
              <p className="text-white font-oswald font-medium text-sm">
                Weekly Check-in Available
              </p>
              <p className="text-white/70 text-xs">
                Schedule with {selectedPeer.name}
              </p>
            </div>
            <Button size="sm" className="bg-midnight hover:bg-matte text-white">
              Schedule
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerChat;
