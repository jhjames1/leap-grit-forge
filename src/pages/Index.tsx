import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import { AuthForm } from '@/components/AuthForm';
import OnboardingFlow from '@/components/OnboardingFlow';
import BottomNavigation from '@/components/BottomNavigation';
import DashboardHome from '@/components/DashboardHome';
import RecoveryJourney from '@/components/RecoveryJourney';
import Toolbox from '@/components/Toolbox';
import PeerChat from '@/components/PeerChat';
import UserProfile from '@/components/UserProfile';
import About from '@/components/About';
import RecoveryCalendar from '@/components/RecoveryCalendar';
import ForemanChat from '@/components/ForemanChat';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPage, setCurrentPage] = useState('home');
  
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { updateUserData } = useUserData();

  useEffect(() => {
    if (!loading) {
      setShowSplash(false);
      // Check if authenticated user needs onboarding
      if (isAuthenticated && user) {
        const hasCompletedOnboarding = localStorage.getItem(`leap_onboarding_${user.user_metadata?.first_name}`);
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
        }
      }
    }
  }, [loading, isAuthenticated, user]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleAuthSuccess = () => {
    // Auth state will be handled by useAuth hook
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    setShowOnboarding(false);
    
    // Mark onboarding as complete
    if (user?.user_metadata?.first_name) {
      localStorage.setItem(`leap_onboarding_${user.user_metadata.first_name}`, 'completed');
    }
    
    // Save onboarding data to userData
    if (user) {
      updateUserData({
        focusAreas: onboardingData.focusAreas || [],
        journeyStage: onboardingData.journeyStage || '',
        supportStyle: onboardingData.supportStyle || '',
        firstName: user.user_metadata?.first_name || ''
      });
    }
  };

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

  const handleSignOut = async () => {
    await signOut();
    setCurrentPage('home');
    setActiveTab('home');
  };

  if (loading || showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }


  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome onNavigate={handleNavigation} />;
      case 'journey':
        return <RecoveryJourney onNavigateToHome={handleBackToHome} />;
      case 'toolbox':
        return <Toolbox onNavigate={handleNavigation} />;
      case 'chat':
        return <PeerChat onBack={handleBackToHome} />;
      case 'profile':
        return <UserProfile onNavigate={handleNavigation} />;
      case 'about':
        return <About onBack={handleBackToHome} />;
      case 'calendar':
        return <RecoveryCalendar onNavigate={handleNavigation} />;
      case 'foreman':
        return <ForemanChat onBack={handleBackToHome} />;
      default:
        return <DashboardHome onNavigate={handleNavigation} />;
    }
  };

  // Hide bottom navigation for certain pages
  const showBottomNav = !['about', 'calendar', 'foreman'].includes(currentPage);

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <div className="relative">
        {renderActivePage()}
      </div>
      {showBottomNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleNavigation} />
      )}
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;