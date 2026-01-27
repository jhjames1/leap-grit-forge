import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import { AuthForm } from '@/components/AuthForm';
import { TestEmailButton } from '@/components/TestEmailButton';
import OnboardingFlow from '@/components/OnboardingFlow';
import BottomNavigation from '@/components/BottomNavigation';
import DashboardHome from '@/components/DashboardHome';
import RecoveryJourney from '@/components/RecoveryJourney';
import Toolbox from '@/components/Toolbox';
import PeerChatRefactored from '@/components/PeerChatRefactored';
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


const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPage, setCurrentPage] = useState('home');
  
  const { user, loading, signOut, isAuthenticated, isNewSignUp } = useAuth();
  const { updateUserData } = useUserData();
  const { newBadges, showCelebration, markBadgesAsSeen } = useBadgeNotifications();

  useEffect(() => {
    if (!loading) {
      setShowSplash(false);
      
      // Check if authenticated user needs onboarding
      if (isAuthenticated && user) {
        console.log('Auth state changed - checking onboarding status for user:', user.id);
        console.log('Is new sign up:', isNewSignUp);
        
        const hasCompletedOnboarding = localStorage.getItem(`leap_onboarding_completed_${user.id}`);
        
        // Check if user has existing data (focus areas) indicating previous setup
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
        
        // Only show onboarding if:
        // 1. This is a new sign-up (not existing user signing in)
        // 2. User hasn't completed onboarding
        // 3. User doesn't have existing setup
        if (isNewSignUp && !hasCompletedOnboarding && !hasExistingSetup) {
          console.log('Triggering onboarding flow for new user:', user.id);
          setShowOnboarding(true);
        } else {
          console.log('Skipping onboarding - existing user or already completed');
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
  }, [loading, isAuthenticated, user, isNewSignUp]);

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

  console.log('Index render state:', { loading, showSplash, isAuthenticated, showOnboarding, isNewSignUp, user: user?.id });

  if (loading || showSplash) {
    console.log('Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!isAuthenticated) {
    console.log('Showing auth form');
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <AuthForm onAuthSuccess={handleAuthSuccess} />
          
          {/* Test Email Button for Development */}
          <div className="flex justify-center">
            <TestEmailButton />
          </div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    console.log('Showing onboarding for new user');
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
        return <PeerChatRefactored onBack={handleBackToHome} />;
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
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
      
      <div className={`relative flex-1 ${showBottomNav ? 'pb-24' : ''} overflow-y-auto`}>
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
