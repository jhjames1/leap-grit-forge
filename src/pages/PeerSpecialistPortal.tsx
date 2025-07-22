
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PeerSpecialistDashboard } from '@/components/PeerSpecialistDashboard';
import { SpecialistLogin } from '@/components/SpecialistLogin';
import { PasswordChangePrompt } from '@/components/PasswordChangePrompt';
import { ChatErrorBoundary } from '@/components/ChatErrorBoundary';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAppointmentNotifications } from '@/hooks/useAppointmentNotifications';

const PeerSpecialistPortal = () => {
  const { user, loading } = useAuth();
  const [isVerifiedSpecialist, setIsVerifiedSpecialist] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to prevent unnecessary re-renders and track operation state
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);

  // Hook for appointment notifications
  const appointmentNotifications = useAppointmentNotifications(specialistId || undefined);

  // ALL HOOKS MUST BE AT THE TOP - Define all callbacks first
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

  // Define checkSpecialistStatus with useCallback to prevent recreation
  const checkSpecialistStatus = useCallback(async () => {
    if (!user?.id || isCheckingRef.current || !mountedRef.current) return;
    
    isCheckingRef.current = true;
    setError(null);
    
    try {
      logger.debug('Checking specialist status for user:', user.id);
      
      const { data: specialistData, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('id, is_verified, is_active, must_change_password')
        .eq('user_id', user.id)
        .single();

      if (!mountedRef.current) return;

      if (specialistError) {
        if (specialistError.code === 'PGRST116') {
          logger.debug('No specialist profile found for user');
          setIsVerifiedSpecialist(false);
          setHasChecked(true);
          return;
        }
        throw specialistError;
      }

      if (specialistData) {
        logger.debug('Specialist data found:', {
          id: specialistData.id,
          isVerified: specialistData.is_verified,
          isActive: specialistData.is_active,
          mustChangePassword: specialistData.must_change_password
        });

        setSpecialistId(specialistData.id);
        setMustChangePassword(specialistData.must_change_password || false);
        setIsVerifiedSpecialist(specialistData.is_verified && specialistData.is_active);
      } else {
        setIsVerifiedSpecialist(false);
      }

      setHasChecked(true);
    } catch (error) {
      logger.error('Error checking specialist status:', error);
      setError(error instanceof Error ? error.message : 'Failed to check specialist status');
      setHasChecked(true);
    } finally {
      isCheckingRef.current = false;
    }
  }, [user?.id]);

  // Effect to check specialist status when user changes
  useEffect(() => {
    mountedRef.current = true;
    
    if (!loading && user?.id && !hasChecked) {
      checkSpecialistStatus();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, loading, hasChecked, checkSpecialistStatus]);

  // NOW we can have conditional returns AFTER all hooks are defined
  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setHasChecked(false);
                checkSpecialistStatus();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking
  if (loading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading specialist portal...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <ChatErrorBoundary onError={handleError}>
        <SpecialistLogin onLogin={handleLogin} />
      </ChatErrorBoundary>
    );
  }

  // Show password change prompt if required
  if (mustChangePassword) {
    return (
      <ChatErrorBoundary onError={handleError}>
        <PasswordChangePrompt 
          onPasswordChanged={handlePasswordChangeComplete}
          userType="specialist"
        />
      </ChatErrorBoundary>
    );
  }

  // Show specialist login if not verified specialist
  if (!isVerifiedSpecialist) {
    return (
      <ChatErrorBoundary onError={handleError}>
        <SpecialistLogin onLogin={handleLogin} />
      </ChatErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ChatErrorBoundary onError={handleError}>
        <PeerSpecialistDashboard 
          specialistId={specialistId}
          appointmentNotifications={appointmentNotifications}
        />
      </ChatErrorBoundary>
    </ErrorBoundary>
  );
};

export default PeerSpecialistPortal;
