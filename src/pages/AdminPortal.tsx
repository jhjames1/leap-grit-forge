import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';

const AdminPortal = () => {
  const { user, loading } = useAuth();
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent unnecessary re-renders and track operation state
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);

  // Define checkAdminStatus with useCallback to prevent recreation
  const checkAdminStatus = useCallback(async () => {
    if (!user || isCheckingRef.current || !mountedRef.current) {
      if (!user) setIsLoading(false);
      return;
    }

    logger.debug('Checking admin status for user', { userId: user.id });
    isCheckingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Check if user has admin role
      const { data: adminData, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      logger.debug('Admin check result', { adminData, error });

      if (!mountedRef.current) return; // Component unmounted, don't update state

      if (!error && adminData) {
        logger.debug('User is verified admin');
        setIsVerifiedAdmin(true);
        
        // Log portal access
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action: 'portal_access',
            type: 'admin_portal',
            details: JSON.stringify({
              access_time: new Date().toISOString()
            })
          });
      } else {
        logger.debug('User is not admin', { error });
        setIsVerifiedAdmin(false);
      }
      
      setHasChecked(true);
    } catch (error) {
      logger.error('Error checking admin status', error);
      if (mountedRef.current) {
        setIsVerifiedAdmin(false);
        setHasChecked(true);
        setError(error instanceof Error ? error.message : 'Failed to check admin status');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      isCheckingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!loading && user && !hasChecked) {
      logger.debug('User state ready, checking admin status', { 
        userId: user?.id, 
        loading 
      });
      checkAdminStatus();
    } else if (!loading && !user) {
      // User is not authenticated, stop loading
      setIsLoading(false);
      setHasChecked(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, loading, hasChecked, checkAdminStatus]);

  const handleLogin = useCallback(() => {
    logger.debug('Login handler called');
    // Reset states and re-check
    setIsVerifiedAdmin(false);
    setHasChecked(false);
    setError(null);
    isCheckingRef.current = false;
  }, []);

  const handleError = useCallback((error: Error, errorInfo: any) => {
    logger.error('Portal error caught by boundary', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });

    // Log error to database for monitoring
    if (user?.id) {
      supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'portal_error',
          type: 'error',
          details: JSON.stringify({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          })
        })
        .then(() => {
          logger.debug('Portal error logged successfully');
        });
    }
  }, [user?.id]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading while auth is loading or we're checking admin status
  if (loading || (isLoading && !hasChecked)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  // Show login if no user or not verified admin
  if (!user || !isVerifiedAdmin) {
    return <AdminLogin onLogin={handleLogin} onBack={() => window.history.back()} />;
  }

  const handleLogout = async () => {
    // The auth hook will handle the logout and trigger re-evaluation
    await supabase.auth.signOut();
  };

  return (
    <ErrorBoundary>
      <AdminDashboard onBack={handleLogout} />
    </ErrorBoundary>
  );
};

export default AdminPortal;