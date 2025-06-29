
import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import BottomNavigation from '@/components/BottomNavigation';
import DashboardHome from '@/components/DashboardHome';
import RecoveryJourney from '@/components/RecoveryJourney';
import Toolbox from '@/components/Toolbox';
import PeerChat from '@/components/PeerChat';
import UserProfile from '@/components/UserProfile';
import About from '@/components/About';
import RecoveryCalendar from '@/components/RecoveryCalendar';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPage, setCurrentPage] = useState('home');

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    if (['home', 'journey', 'toolbox', 'chat', 'profile'].includes(page)) {
      setActiveTab(page);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setActiveTab('home');
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome onNavigate={handleNavigation} />;
      case 'journey':
        return <RecoveryJourney />;
      case 'toolbox':
        return <Toolbox />;
      case 'chat':
        return <PeerChat />;
      case 'profile':
        return <UserProfile />;
      case 'about':
        return <About onBack={handleBackToHome} />;
      case 'calendar':
        return <RecoveryCalendar onBack={handleBackToHome} />;
      default:
        return <DashboardHome onNavigate={handleNavigation} />;
    }
  };

  // Hide bottom navigation for certain pages
  const showBottomNav = !['about', 'calendar'].includes(currentPage);

  return (
    <div className="min-h-screen bg-gradient-industrial">
      {renderActivePage()}
      {showBottomNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleNavigation} />
      )}
    </div>
  );
};

export default Index;
