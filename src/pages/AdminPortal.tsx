import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const AdminPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { user, signOut } = useAuth();

  // Listen to auth state changes to sync with actual authentication
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    // Sign out from Supabase which will trigger the useEffect above
    await signOut();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} onBack={() => window.history.back()} />;
  }

  return <AdminDashboard onBack={handleLogout} />;
};

export default AdminPortal;