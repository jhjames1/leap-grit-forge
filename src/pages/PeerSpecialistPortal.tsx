
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SpecialistLogin from '@/components/SpecialistLogin';
import PeerSpecialistDashboard from '@/components/PeerSpecialistDashboard';
import ChatErrorBoundary from '@/components/ChatErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';
import PasswordChangePrompt from '@/components/PasswordChangePrompt';
import { useToast } from '@/hooks/use-toast';

const PeerSpecialistPortal = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isVerifiedSpecialist, setIsVerifiedSpecialist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordStatusChecked, setPasswordStatusChecked] = useState(false);
  
  // Use refs to prevent unnecessary re-renders and track operation state
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);

  // Handle password reset callback
  useEffect(() => {
    const handlePasswordReset = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');

      console.log('Password reset URL params:', { 
        type, 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken,
        fullUrl: window.location.href 
      });

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          console.log('Attempting to set session with recovery tokens...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Session set error:', error);
            throw error;
          }

          console.log('Session set successfully:', data);

          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "Password Reset Successful",
            description: "You can now set a new password. Please use the password change prompt below.",
          });

          // Force password change for security
          setMustChangePassword(true);
        } catch (error: any) {
          console.error('Password reset error:', error);
          toast({
            title: "Password Reset Error",
            description: `${error.message || "Failed to process password reset"}. Please request a new password reset.`,
            variant: "destructive"
          });
        }
      }
    };

    handlePasswordReset();
  }, [toast]);

  // ALL useCallback hooks must be defined at the top level, unconditionally
  const checkSpecialistStatus = useCallback(async () => {
    if (!user || isCheckingRef.current || !mountedRef.current) {
      if (!user) setIsLoading(false);
      return;
    }

    logger.debug('Checking specialist status for user', { userId: user.id });
    isCheckingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is a verified peer specialist
      const { data: specialistData, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_verified', true)
        .single();

      logger.debug('Specialist check result', { specialistData, error });

      if (!mountedRef.current) return; // Component unmounted, don't update state

      if (!error && specialistData) {
        logger.debug('User is verified specialist');
        setIsVerifiedSpecialist(true);
        setSpecialistId(specialistData.id);
        setMustChangePassword(specialistData.must_change_password || false);
        
        // Log portal access
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action: 'portal_access',
            type: 'specialist_portal',
            details: JSON.stringify({
              specialist_id: specialistData.id,
              access_time: new Date().toISOString(),
              must_change_password: specialistData.must_change_password
            })
          });
      } else {
        logger.debug('User is not verified specialist', { error });
        setIsVerifiedSpecialist(false);
        setSpecialistId(null);
      }
      
      setHasChecked(true);
      setPasswordStatusChecked(true);
    } catch (error) {
      logger.error('Error checking specialist status', error);
      if (mountedRef.current) {
        setIsVerifiedSpecialist(false);
        setHasChecked(true);
        setPasswordStatusChecked(true);
        setError(error instanceof Error ? error.message : 'Failed to check specialist status');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      isCheckingRef.current = false;
    }
  }, [user?.id]);

  const handleLogin = useCallback(() => {
    logger.debug('Login handler called');
    // Reset states and re-check
    setIsVerifiedSpecialist(false);
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

  const handlePasswordChangeComplete = useCallback(async () => {
    setMustChangePassword(false);
    
    // Log password change completion
    if (user?.id && specialistId) {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'password_changed_first_login',
          type: 'security',
          details: JSON.stringify({
            specialist_id: specialistId,
            timestamp: new Date().toISOString()
          })
        });
    }
  }, [specialistId, user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!loading && user && !hasChecked) {
      logger.debug('User state ready, checking specialist status', { 
        userId: user?.id, 
        loading 
      });
      checkSpecialistStatus();
    } else if (!loading && !user) {
      // User is not authenticated, stop loading
      setIsLoading(false);
      setHasChecked(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, loading, hasChecked, checkSpecialistStatus]);

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

  // Show loading while auth is loading or we're checking specialist status
  if (loading || (isLoading && !hasChecked)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-construction mx-auto mb-4" />
          <p className="text-muted-foreground">Loading specialist portal...</p>
        </div>
      </div>
    );
  }

  // Show login if no user or not verified specialist
  if (!user || !isVerifiedSpecialist) {
    return (
      <ChatErrorBoundary onError={handleError}>
        <SpecialistLogin onLogin={handleLogin} onBack={() => window.history.back()} />
      </ChatErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ChatErrorBoundary onError={handleError}>
        {/* Password change prompt modal */}
        {passwordStatusChecked && mustChangePassword && specialistId && (
          <PasswordChangePrompt 
            isOpen={mustChangePassword}
            specialistId={specialistId}
            onComplete={handlePasswordChangeComplete}
          />
        )}
        
        <PeerSpecialistDashboard />
      </ChatErrorBoundary>
    </ErrorBoundary>
  );
};

export default PeerSpecialistPortal;
