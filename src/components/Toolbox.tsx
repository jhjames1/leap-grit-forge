
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
      color: 'bg-construction hover:bg-construction-dark',
      badge: 'Track',
      badgeColor: 'bg-construction'
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
      color: 'bg-green-600 hover:bg-green-700',
      badge: 'Mindset',
      badgeColor: 'bg-green-500'
    },
    {
      id: 'journal',
      title: 'Quick Journal',
      description: 'Voice or text entry',
      icon: BookOpen,
      color: 'bg-blue-600 hover:bg-blue-700',
      badge: 'Reflect',
      badgeColor: 'bg-blue-500'
    },
    {
      id: 'peer',
      title: 'Message Peer',
      description: 'Connect with your specialist',
      icon: MessageSquare,
      color: 'bg-purple-600 hover:bg-purple-700',
      badge: 'Support',
      badgeColor: 'bg-purple-500'
    }
  ];

  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case 'panic':
        // Emergency help action
        alert('Connecting you to emergency support...');
        break;
      case 'breathing':
        setShowBreathing(true);
        break;
      case 'urge':
        // Show urge tracker
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
            <div className="text-xl font-anton text-construction">7</div>
            <div className="text-xs text-steel-light font-oswald">Tools Used Today</div>
          </div>
          <div>
            <div className="text-xl font-anton text-construction">23</div>
            <div className="text-xs text-steel-light font-oswald">Day Streak</div>
          </div>
          <div>
            <div className="text-xl font-anton text-construction">142</div>
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
            <div className="w-2 h-2 bg-construction rounded-full"></div>
            <span className="text-steel-light">Breathing exercise - 2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-steel-light">Gratitude entry - 5 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-steel-light">Journal entry - Yesterday</span>
          </div>
        </div>
      </Card>

      {/* Breathing Exercise Modal */}
      {showBreathing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
            <div className="text-center">
              <h3 className="font-oswald font-semibold text-white text-xl mb-4">
                4-7-8 Breathing
              </h3>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-4">
                  <Wind className="text-construction" size={32} />
                </div>
                <p className="text-steel-light text-sm leading-relaxed">
                  Inhale for 4 counts, hold for 7, exhale for 8. 
                  This helps activate your body's relaxation response.
                </p>
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold">
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
    </div>
  );
};

export default Toolbox;
