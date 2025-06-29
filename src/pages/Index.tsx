
import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import BottomNavigation from '@/components/BottomNavigation';
import DashboardHome from '@/components/DashboardHome';
import RecoveryJourney from '@/components/RecoveryJourney';
import Toolbox from '@/components/Toolbox';
import PeerChat from '@/components/PeerChat';
import UserProfile from '@/components/UserProfile';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome />;
      case 'journey':
        return <RecoveryJourney />;
      case 'toolbox':
        return <Toolbox />;
      case 'chat':
        return <PeerChat />;
      case 'profile':
        return <UserProfile />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-industrial">
      {renderActiveTab()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
