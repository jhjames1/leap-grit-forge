
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Wind, 
  Heart, 
  BookOpen, 
  Phone, 
  TrendingUp,
  Timer,
  MessageSquare
} from 'lucide-react';

const Toolbox = () => {
  const [urgeLevel, setUrgeLevel] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showUrgeTracker, setShowUrgeTracker] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const handleEmergencyCall = () => {
    window.location.href = 'tel:+14327018678';
  };

  const handlePeerSupport = () => {
    window.location.href = 'sms:+14327018678?body=I need support right now.';
  };

  const tools = [
    {
      id: 'panic',
      title: 'Emergency Help',
      description: 'Get immediate support',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      badge: 'Emergency',
      badgeColor: 'bg-red-500'
    },
    {
      id: 'urge',
      title: 'Urge Tracker',
      description: 'Log and track cravings',
      icon: TrendingUp,
      color: 'bg-steel hover:bg-steel-light',
      badge: 'Track',
      badgeColor: 'bg-steel'
    },
    {
      id: 'breathing',
      title: 'Breathing Exercise',
      description: '4-7-8 technique for calm',
      icon: Wind,
      color: 'bg-steel hover:bg-steel-light',
      badge: 'Calm',
      badgeColor: 'bg-steel'
    },
    {
      id: 'gratitude',
      title: 'Gratitude Log',
      description: 'Focus on the positive',
      icon: Heart,
      color: 'bg-steel hover:bg-steel-light',
      badge: 'Mindset',
      badgeColor: 'bg-steel'
    },
    {
      id: 'journal',
      title: 'Quick Journal',
      description: 'Voice or text entry',
      icon: BookOpen,
      color: 'bg-steel hover:bg-steel-light',
      badge: 'Reflect',
      badgeColor: 'bg-steel'
    },
    {
      id: 'peer',
      title: 'Message Peer',
      description: 'Connect with your specialist',
      icon: MessageSquare,
      color: 'bg-steel hover:bg-steel-light',
      badge: 'Support',
      badgeColor: 'bg-steel'
    }
  ];

  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case 'panic':
        handleEmergencyCall();
        break;
      case 'breathing':
        setShowBreathing(true);
        break;
      case 'urge':
        setShowUrgeTracker(true);
        break;
      case 'gratitude':
        setShowGratitudeLog(true);
        break;
      case 'journal':
        setShowJournal(true);
        break;
      case 'peer':
        handlePeerSupport();
        break;
      default:
        console.log(`Opening ${toolId} tool`);
    }
  };

  return (
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-anton text-3xl text-white mb-2">Recovery Toolbox</h1>
        <p className="text-steel-light font-oswald">Your support tools, always ready</p>
      </div>

      {/* Quick Stats */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-anton text-steel-light">7</div>
            <div className="text-xs text-steel-light font-oswald">Tools Used Today</div>
          </div>
          <div>
            <div className="text-xl font-anton text-steel-light">23</div>
            <div className="text-xs text-steel-light font-oswald">Day Streak</div>
          </div>
          <div>
            <div className="text-xl font-anton text-steel-light">142</div>
            <div className="text-xs text-steel-light font-oswald">Total Sessions</div>
          </div>
        </div>
      </Card>

      {/* Emergency Button */}
      <Button 
        onClick={() => handleToolClick('panic')}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-oswald font-bold py-6 mb-6 rounded-xl text-lg tracking-wide industrial-shadow"
      >
        <AlertTriangle className="mr-3" size={24} />
        I NEED HELP NOW
      </Button>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-4">
        {tools.filter(tool => tool.id !== 'panic').map((tool) => {
          const Icon = tool.icon;
          
          return (
            <Card 
              key={tool.id}
              className="bg-white/10 backdrop-blur-sm border-steel-dark hover:bg-white/15 transition-all duration-200 cursor-pointer"
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg ${tool.color.split(' ')[0]} ${tool.color.split(' ')[0].replace('bg-', '')}`}>
                    <Icon className="text-white" size={20} />
                  </div>
                  <Badge className={`${tool.badgeColor} text-white text-xs font-oswald`}>
                    {tool.badge}
                  </Badge>
                </div>
                
                <h3 className="font-oswald font-semibold text-white mb-2">
                  {tool.title}
                </h3>
                <p className="text-steel-light text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mt-6 p-6">
        <h3 className="font-oswald font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-steel rounded-full"></div>
            <span className="text-steel-light">Breathing exercise - 2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-steel rounded-full"></div>
            <span className="text-steel-light">Gratitude entry - 5 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-steel rounded-full"></div>
            <span className="text-steel-light">Journal entry - Yesterday</span>
          </div>
        </div>
      </Card>

      {/* Modals */}
      {showBreathing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
            <div className="text-center">
              <h3 className="font-oswald font-semibold text-white text-xl mb-4">
                4-7-8 Breathing
              </h3>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-steel/20 rounded-full flex items-center justify-center mb-4">
                  <Wind className="text-steel" size={32} />
                </div>
                <p className="text-steel-light text-sm leading-relaxed">
                  Inhale for 4 counts, hold for 7, exhale for 8. 
                  This helps activate your body's relaxation response.
                </p>
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-steel hover:bg-steel-light text-white font-oswald font-semibold">
                  Start Exercise
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBreathing(false)}
                  className="w-full border-steel text-steel-light hover:bg-steel/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showUrgeTracker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
            <div className="text-center">
              <h3 className="font-oswald font-semibold text-white text-xl mb-4">Urge Tracker</h3>
              <p className="text-steel-light text-sm mb-6">Rate your current urge level (1-10)</p>
              <div className="flex justify-center space-x-2 mb-6">
                {[1,2,3,4,5,6,7,8,9,10].map((level) => (
                  <button
                    key={level}
                    onClick={() => setUrgeLevel(level)}
                    className={`w-8 h-8 rounded ${
                      urgeLevel === level ? 'bg-steel text-white' : 'bg-steel-dark text-steel-light'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-steel hover:bg-steel-light text-white font-oswald font-semibold">
                  Log Urge
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUrgeTracker(false)}
                  className="w-full border-steel text-steel-light hover:bg-steel/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showGratitudeLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
            <div className="text-center">
              <h3 className="font-oswald font-semibold text-white text-xl mb-4">Gratitude Log</h3>
              <textarea 
                placeholder="What are you grateful for today?"
                className="w-full h-32 p-3 bg-steel-dark border border-steel text-white placeholder:text-steel-light rounded mb-4"
              />
              <div className="space-y-3">
                <Button className="w-full bg-steel hover:bg-steel-light text-white font-oswald font-semibold">
                  Save Entry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowGratitudeLog(false)}
                  className="w-full border-steel text-steel-light hover:bg-steel/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showJournal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
            <div className="text-center">
              <h3 className="font-oswald font-semibold text-white text-xl mb-4">Quick Journal</h3>
              <textarea 
                placeholder="How are you feeling right now? What's on your mind?"
                className="w-full h-32 p-3 bg-steel-dark border border-steel text-white placeholder:text-steel-light rounded mb-4"
              />
              <div className="space-y-3">
                <Button className="w-full bg-steel hover:bg-steel-light text-white font-oswald font-semibold">
                  Save Entry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowJournal(false)}
                  className="w-full border-steel text-steel-light hover:bg-steel/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Toolbox;
