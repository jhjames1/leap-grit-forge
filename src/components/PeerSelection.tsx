
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, MessageCircle, Video, Phone } from 'lucide-react';

interface PeerSelectionProps {
  onBack: () => void;
  onSelectPeer: (peer: any) => void;
}

const PeerSelection = ({ onBack, onSelectPeer }: PeerSelectionProps) => {
  const [peers] = useState([
    {
      id: 1,
      name: 'Mike Rodriguez',
      status: 'online',
      yearsInRecovery: 5,
      availability: 'Available now'
    },
    {
      id: 2,
      name: 'David Chen',
      status: 'away',
      yearsInRecovery: 3,
      availability: 'Back in 15 mins'
    },
    {
      id: 3,
      name: 'Marcus Thompson',
      status: 'offline',
      yearsInRecovery: 8,
      availability: 'Available at 2:00 PM'
    },
    {
      id: 4,
      name: 'James Wilson',
      status: 'online',
      yearsInRecovery: 4,
      availability: 'Available now'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const handleSelectPeer = (peer: any) => {
    if (peer.status === 'offline') {
      const leaveMessage = confirm(`${peer.name} is currently offline. Would you like to leave a message?`);
      if (leaveMessage) {
        onSelectPeer({ ...peer, isOfflineMessage: true });
      }
    } else {
      onSelectPeer(peer);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-steel-light hover:text-white mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">PEER</span><span className="font-fjalla font-extrabold italic">SELECTION</span>
          </h1>
          <p className="text-steel-light font-oswald">Choose someone to talk with</p>
        </div>
      </div>

      {/* Available Peers */}
      <div className="space-y-4">
        {peers.map((peer) => (
          <Card key={peer.id} className="bg-card p-4 border-0 shadow-none">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-steel rounded-full flex items-center justify-center">
                  <User className="text-white" size={20} />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(peer.status)} rounded-full border-2 border-midnight`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-fjalla font-bold text-card-foreground">{peer.name}</h3>
                  <Badge className={`text-xs ${peer.status === 'online' ? 'bg-green-500/20 text-green-400' : peer.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {getStatusText(peer.status)}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-2">Years in Recovery: {peer.yearsInRecovery}</p>
                <p className="text-muted-foreground text-xs mb-3">{peer.availability}</p>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleSelectPeer(peer)}
                    size="sm"
                    className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold flex-1"
                    disabled={peer.status === 'offline'}
                  >
                    <MessageCircle size={14} className="mr-1" />
                    {peer.status === 'offline' ? 'Leave Message' : 'Start Chat'}
                  </Button>
                  
                  {peer.status === 'online' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-steel text-steel-light hover:bg-steel/10"
                      >
                        <Phone size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-steel text-steel-light hover:bg-steel/10"
                      >
                        <Video size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Emergency Support */}
      <Card className="bg-red-500/10 border-red-500/30 p-4 mt-6 border-0 shadow-none">
        <div className="text-center">
          <h3 className="font-fjalla font-bold text-card-foreground mb-2">Need Immediate Support?</h3>
          <p className="text-muted-foreground text-sm mb-3">If you're in crisis, call the National Suicide Prevention Lifeline</p>
          <Button 
            onClick={() => window.location.href = 'tel:988'}
            className="bg-red-500 hover:bg-red-600 text-white font-oswald font-semibold"
          >
            Call 988
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default PeerSelection;
