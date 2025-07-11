
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, MessageCircle, Video, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeerSpecialists, PeerSpecialist } from '@/hooks/usePeerSpecialists';

interface PeerSelectionProps {
  onBack: () => void;
  onSelectPeer: (peer: PeerSpecialist) => void;
}

const PeerSelection = ({ onBack, onSelectPeer }: PeerSelectionProps) => {
  const { t } = useLanguage();
  const { specialists, loading, error } = usePeerSpecialists();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return t('toolbox.peerSupport.status.online');
      case 'away': return t('toolbox.peerSupport.status.away');
      case 'offline': return t('toolbox.peerSupport.status.offline');
      case 'busy': return 'Busy';
      default: return 'Unknown';
    }
  };

  const getAvailabilityText = (specialist: PeerSpecialist) => {
    switch (specialist.status.status) {
      case 'online': return 'Available now';
      case 'away': return specialist.status.status_message || 'Away';
      case 'offline': return 'Offline';
      case 'busy': return 'Busy';
      default: return '';
    }
  };

  const handleSelectPeer = (specialist: PeerSpecialist) => {
    if (specialist.status.status === 'offline') {
      const leaveMessage = confirm(`${specialist.first_name} ${specialist.last_name} ${t('toolbox.peerSupport.offlineConfirm')}`);
      if (leaveMessage) {
        onSelectPeer({ ...specialist, isOfflineMessage: true } as any);
      }
    } else {
      onSelectPeer(specialist);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <p className="text-muted-foreground">Loading specialists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <p className="text-red-500">Error loading specialists: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4">
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
          <h1 className="text-5xl text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">{t('toolbox.peerSupport.title').split(' ')[0]}</span><span className="font-fjalla font-extrabold italic">{t('toolbox.peerSupport.title').split(' ')[1]}</span>
          </h1>
          <p className="text-steel-light font-oswald">{t('toolbox.peerSupport.subtitle')}</p>
        </div>
      </div>

      {/* Available Peers */}
      <div className="space-y-4">
        {specialists.map((specialist) => (
          <Card key={specialist.id} className="bg-card p-4 border-0 shadow-none">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-steel rounded-full flex items-center justify-center">
                  <User className="text-white" size={20} />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(specialist.status.status)} rounded-full`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-fjalla font-bold text-card-foreground">{specialist.first_name} {specialist.last_name}</h3>
                  <Badge className={`text-xs ${specialist.status.status === 'online' ? 'bg-green-500/20 text-green-400' : specialist.status.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {getStatusText(specialist.status.status)}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-2">{specialist.years_experience} years experience</p>
                {specialist.specialties.length > 0 && (
                  <p className="text-muted-foreground text-xs mb-2">Specialties: {specialist.specialties.join(', ')}</p>
                )}
                <p className="text-muted-foreground text-xs mb-3">{getAvailabilityText(specialist)}</p>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleSelectPeer(specialist)}
                    size="sm"
                    className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold flex-1"
                  >
                    <MessageCircle size={14} className="mr-1" />
                    {specialist.status.status === 'offline' ? t('toolbox.peerSupport.actions.leaveMessage') : t('toolbox.peerSupport.actions.startChat')}
                  </Button>
                  
                  {specialist.status.status === 'online' && (
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
