import { useState, useEffect } from 'react';

interface AdminAuthState {
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    // Check if admin is already logged in
    const adminLoggedIn = localStorage.getItem('admin_logged_in');
    setAuthState({
      isAuthenticated: adminLoggedIn === 'true',
      loading: false
    });
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'adminadmin') {
      localStorage.setItem('admin_logged_in', 'true');
      setAuthState({ isAuthenticated: true, loading: false });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('admin_logged_in');
    setAuthState({ isAuthenticated: false, loading: false });
  };

  return {
    ...authState,
    login,
    logout
  };
}