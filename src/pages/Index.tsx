
import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import UserAuth from '@/components/UserAuth';
import PersonalizedGreeting from '@/components/PersonalizedGreeting';
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
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentPage, setCurrentPage] = useState('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const existingUser = localStorage.getItem('currentUser');
    if (existingUser) {
      setCurrentUser(existingUser);
      // Update last login timestamp
      localStorage.setItem('lastLogin', new Date().toDateString());
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (!currentUser) {
      setShowAuth(true);
    } else {
      // Always show onboarding for returning users too
      setShowOnboarding(true);
    }
  };

  const handleLogin = (userData: { firstName: string; isNewUser: boolean }) => {
    setCurrentUser(userData.firstName);
    localStorage.setItem('currentUser', userData.firstName);
    setShowAuth(false);
    
    // Always show onboarding for every user
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    setShowOnboarding(false);
    setShowGreeting(true);
  };

  const handleGreetingComplete = () => {
    setShowGreeting(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (showAuth) {
    return <UserAuth onLogin={handleLogin} />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (showGreeting) {
    return (
      <PersonalizedGreeting 
        firstName={currentUser || undefined}
        onContinue={handleGreetingComplete}
      />
    );
  }

  if (showAdminLogin && !isAdminLoggedIn) {
    return (
      <AdminLogin 
        onLogin={() => {
          setIsAdminLoggedIn(true);
          setCurrentPage('admin');
        }}
        onBack={() => setShowAdminLogin(false)}
      />
    );
  }

  const handleNavigation = (page: string) => {
    if (page === 'admin-login') {
      setShowAdminLogin(true);
      return;
    }
    
    setCurrentPage(page);
    if (['home', 'journey', 'toolbox', 'chat', 'profile'].includes(page)) {
      setActiveTab(page);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setActiveTab('home');
    setIsAdminLoggedIn(false);
    setShowAdminLogin(false);
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome onNavigate={handleNavigation} />;
      case 'journey':
        return <RecoveryJourney />;
      case 'toolbox':
        return <Toolbox onNavigate={handleNavigation} />;
      case 'chat':
        return <PeerChat onBack={handleBackToHome} />;
      case 'profile':
        return <UserProfile onNavigate={handleNavigation} />;
      case 'about':
        return <About onBack={handleBackToHome} />;
      case 'calendar':
        return <RecoveryCalendar onBack={handleBackToHome} />;
      case 'foreman':
        return <ForemanChat onBack={handleBackToHome} />;
      case 'admin':
        return <AdminDashboard onBack={handleBackToHome} />;
      default:
        return <DashboardHome onNavigate={handleNavigation} />;
    }
  };

  // Hide bottom navigation for certain pages
  const showBottomNav = !['about', 'calendar', 'foreman', 'admin'].includes(currentPage);

  return (
    <div className="min-h-screen bg-background">
      {renderActivePage()}
      {showBottomNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleNavigation} />
      )}
    </div>
  );
};

export default Index;
