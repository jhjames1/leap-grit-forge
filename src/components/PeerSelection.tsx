
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, MessageCircle, Video, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PeerSelectionProps {
  onBack: () => void;
  onSelectPeer: (peer: any) => void;
}

const PeerSelection = ({ onBack, onSelectPeer }: PeerSelectionProps) => {
  const { t } = useLanguage();
  const [peers] = useState([
    {
      id: 1,
      name: 'Mike Rodriguez',
      status: 'online',
      yearsInRecovery: 5,
      availabilityType: 'now'
    },
    {
      id: 2,
      name: 'David Chen',
      status: 'away',
      yearsInRecovery: 3,
      availabilityType: 'back15'
    },
    {
      id: 3,
      name: 'Marcus Thompson',
      status: 'offline',
      yearsInRecovery: 8,
      availabilityType: 'at',
      availabilityTime: '2:00 PM'
    },
    {
      id: 4,
      name: 'James Wilson',
      status: 'online',
      yearsInRecovery: 4,
      availabilityType: 'now'
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
      case 'online': return t('toolbox.peerSupport.status.online');
      case 'away': return t('toolbox.peerSupport.status.away');
      case 'offline': return t('toolbox.peerSupport.status.offline');
      default: return 'Unknown';
    }
  };

  const getAvailabilityText = (peer: any) => {
    switch (peer.availabilityType) {
      case 'now': return t('toolbox.peerSupport.availability.availableNow');
      case 'back15': return t('toolbox.peerSupport.availability.backIn15');
      case 'at': return `${t('toolbox.peerSupport.availability.availableAt')} ${peer.availabilityTime}`;
      default: return '';
    }
  };

  const handleSelectPeer = (peer: any) => {
    if (peer.status === 'offline') {
      const leaveMessage = confirm(`${peer.name} ${t('toolbox.peerSupport.offlineConfirm')}`);
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
            <span className="font-oswald font-extralight tracking-tight">{t('toolbox.peerSupport.title').split(' ')[0]}</span><span className="font-fjalla font-extrabold italic">{t('toolbox.peerSupport.title').split(' ')[1]}</span>
          </h1>
          <p className="text-steel-light font-oswald">{t('toolbox.peerSupport.subtitle')}</p>
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
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(peer.status)} rounded-full`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-fjalla font-bold text-card-foreground">{peer.name}</h3>
                  <Badge className={`text-xs ${peer.status === 'online' ? 'bg-green-500/20 text-green-400' : peer.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {getStatusText(peer.status)}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-2">{t('toolbox.peerSupport.yearsInRecovery')} {peer.yearsInRecovery}</p>
                <p className="text-muted-foreground text-xs mb-3">{getAvailabilityText(peer)}</p>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleSelectPeer(peer)}
                    size="sm"
                    className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold flex-1"
                    disabled={peer.status === 'offline'}
                  >
                    <MessageCircle size={14} className="mr-1" />
                    {peer.status === 'offline' ? t('toolbox.peerSupport.actions.leaveMessage') : t('toolbox.peerSupport.actions.startChat')}
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
          <h3 className="font-fjalla font-bold text-card-foreground mb-2">{t('toolbox.peerSupport.emergencySupport.title')}</h3>
          <p className="text-muted-foreground text-sm mb-3">{t('toolbox.peerSupport.emergencySupport.description')}</p>
          <Button 
            onClick={() => window.location.href = 'tel:988'}
            className="bg-red-500 hover:bg-red-600 text-white font-oswald font-semibold"
          >
            {t('toolbox.peerSupport.emergencySupport.callButton')}
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default PeerSelection;
