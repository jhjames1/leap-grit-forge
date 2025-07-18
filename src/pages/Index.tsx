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
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import { BadgeCelebrationModal } from '@/components/BadgeCelebrationModal';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPage, setCurrentPage] = useState('home');
  
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { updateUserData } = useUserData();
  const { newBadges, showCelebration, markBadgesAsSeen } = useBadgeNotifications();

  useEffect(() => {
    if (!loading) {
      setShowSplash(false);
      
      // Check if authenticated user needs onboarding
      if (isAuthenticated && user) {
        console.log('Auth state changed - checking onboarding status for user:', user.id);
        const hasCompletedOnboarding = localStorage.getItem(`leap_onboarding_completed_${user.id}`);
        
        // Also check if user has existing data (focus areas) indicating previous setup
        const existingUserData = localStorage.getItem('leap_user_data');
        let hasExistingSetup = false;
        
        if (existingUserData) {
          try {
            const userData = JSON.parse(existingUserData);
            hasExistingSetup = userData?.focusAreas?.length > 0;
          } catch (error) {
            console.error('Error parsing existing user data:', error);
          }
        }
        
        console.log('Onboarding completion status:', hasCompletedOnboarding);
        console.log('Has existing setup:', hasExistingSetup);
        
        if (!hasCompletedOnboarding && !hasExistingSetup) {
          console.log('Triggering onboarding flow for user:', user.id);
          setShowOnboarding(true);
        } else {
          console.log('User has already completed onboarding or has existing setup');
          // Mark as completed if they have existing setup but no completion flag
          if (!hasCompletedOnboarding && hasExistingSetup) {
            localStorage.setItem(`leap_onboarding_completed_${user.id}`, 'completed');
          }
        }
      } else if (!isAuthenticated && !loading) {
        console.log('User not authenticated, hiding onboarding');
        setShowOnboarding(false);
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
    
    // Mark onboarding as complete for this authenticated user
    if (user?.id) {
      localStorage.setItem(`leap_onboarding_completed_${user.id}`, 'completed');
    }
    
    // Save onboarding data to userData
    if (user) {
      updateUserData({
        focusAreas: onboardingData.focusAreas || [],
        journeyStage: onboardingData.journeyStage || '',
        supportStyle: onboardingData.supportStyle || '',
        firstName: onboardingData.firstName || user.user_metadata?.first_name || '',
        gender: onboardingData.gender || ''
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

  console.log('Index render state:', { loading, showSplash, isAuthenticated, showOnboarding, user: user?.id });

  if (loading || showSplash) {
    console.log('Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!isAuthenticated) {
    console.log('Showing auth form');
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (showOnboarding) {
    console.log('Showing onboarding');
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
        return <PeerChat specialistId="" specialistName="Specialist" onBack={handleBackToHome} />;
      case 'profile':
        return <UserProfile onNavigate={handleNavigation} />;
      case 'about':
        return <About onBack={handleBackToHome} />;
      case 'calendar':
        return <RecoveryCalendar onNavigate={handleNavigation} />;
      case 'foreman':
        return <ForemanChat onBack={handleBackToHome} onNavigate={handleNavigation} />;
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
      
      {/* Badge Celebration Modal */}
      <BadgeCelebrationModal 
        badges={newBadges}
        isOpen={showCelebration}
        onClose={markBadgesAsSeen}
      />
    </div>
  );
};

export default Index;