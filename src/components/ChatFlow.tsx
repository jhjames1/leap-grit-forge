
import { useState } from 'react';
import PeerSelection from '@/components/PeerSelection';
import PeerChat from '@/components/PeerChat';
import { PeerSpecialist } from '@/hooks/usePeerSpecialists';

interface ChatFlowProps {
  onBack: () => void;
}

const ChatFlow = ({ onBack }: ChatFlowProps) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<PeerSpecialist | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleSelectPeer = (specialist: PeerSpecialist) => {
    setSelectedSpecialist(specialist);
    setShowChat(true);
  };

  const handleBackToSelection = () => {
    setShowChat(false);
    setSelectedSpecialist(null);
  };

  const handleBackToHome = () => {
    setShowChat(false);
    setSelectedSpecialist(null);
    onBack();
  };

  if (showChat && selectedSpecialist) {
    return (
      <PeerChat
        specialistId={selectedSpecialist.id}
        specialistName={`${selectedSpecialist.first_name} ${selectedSpecialist.last_name}`}
        onBack={handleBackToSelection}
        onSessionEnded={handleBackToSelection}
      />
    );
  }

  return (
    <PeerSelection
      onBack={handleBackToHome}
      onSelectPeer={handleSelectPeer}
    />
  );
};

export default ChatFlow;
