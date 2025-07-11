import { useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const AdminPortal = () => {
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

  return <AdminDashboard onBack={handleLogout} />;
};

export default AdminPortal;