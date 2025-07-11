import { useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import PeerSpecialistDashboard from '@/components/PeerSpecialistDashboard';

const PeerSpecialistPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} onBack={() => window.history.back()} />;
  }

  return <PeerSpecialistDashboard />;
};

export default PeerSpecialistPortal;