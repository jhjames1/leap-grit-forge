
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Phone, 
  Video, 
  Calendar, 
  Clock, 
  MessageCircle,
  User,
  Shield
} from 'lucide-react';

const PeerChat = () => {
  const [message, setMessage] = useState('');
  const [messages] = useState([
    {
      id: 1,
      sender: 'peer',
      text: "Hey there! How are you doing today? I saw you completed your day 23 module - that's awesome progress!",
      time: '10:30 AM',
      isRead: true
    },
    {
      id: 2,
      sender: 'user',
      text: "Thanks! It was tough this morning but I'm feeling better now. Work stress was getting to me.",
      time: '10:45 AM',
      isRead: true
    },
    {
      id: 3,
      sender: 'peer',
      text: "I totally get that. Work stress is one of the biggest triggers for a lot of guys. Have you tried the breathing technique we talked about?",
      time: '10:47 AM',
      isRead: true
    },
    {
      id: 4,
      sender: 'user',
      text: "Yeah, actually used it twice today. Really helps center me.",
      time: '11:15 AM',
      isRead: true
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handlePhoneCall = () => {
    window.location.href = 'tel:+14327018678';
  };

  const handleVideoCall = () => {
    // For video calls, we'll open a link to start a video call
    window.open('https://meet.google.com/new', '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-industrial">
      {/* Header */}
      <div className="bg-midnight/90 backdrop-blur-sm border-b border-steel-dark p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-steel rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-oswald font-semibold text-white">Mike Rodriguez</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-steel-light text-sm">Certified Peer Specialist</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              onClick={handlePhoneCall}
            >
              <Phone size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-steel text-steel-light hover:text-white hover:bg-steel/20"
              onClick={handleVideoCall}
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
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
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
        ))}
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
      <div className="absolute top-20 left-4 right-4 bg-steel/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <Calendar className="text-white" size={16} />
          <div className="flex-1">
            <p className="text-white font-oswald font-medium text-sm">
              Weekly Check-in Scheduled
            </p>
            <p className="text-white/70 text-xs">
              Tomorrow at 2:00 PM
            </p>
          </div>
          <Button size="sm" className="bg-midnight hover:bg-matte text-white">
            View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PeerChat;
