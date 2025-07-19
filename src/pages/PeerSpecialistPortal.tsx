
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SpecialistLogin from '@/components/SpecialistLogin';
import PeerSpecialistDashboard from '@/components/PeerSpecialistDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const PeerSpecialistPortal = () => {
  const { user, loading } = useAuth();
  const [isVerifiedSpecialist, setIsVerifiedSpecialist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent unnecessary re-renders and track operation state
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);

  // Define checkSpecialistStatus with useCallback to prevent recreation
  const checkSpecialistStatus = useCallback(async () => {
    if (!user || isCheckingRef.current || !mountedRef.current) {
      if (!user) setIsLoading(false);
      return;
    }

    console.log('🔍 Checking specialist status for user:', user.id);
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

      console.log('📋 Specialist check result:', { specialistData, error });

      if (!mountedRef.current) return; // Component unmounted, don't update state

      if (!error && specialistData) {
        console.log('✅ User is verified specialist');
        setIsVerifiedSpecialist(true);
      } else {
        console.log('❌ User is not verified specialist');
        setIsVerifiedSpecialist(false);
      }
      
      setHasChecked(true);
    } catch (error) {
      console.error('❌ Error checking specialist status:', error);
      if (mountedRef.current) {
        setIsVerifiedSpecialist(false);
        setHasChecked(true);
        setError(error instanceof Error ? error.message : 'Failed to check specialist status');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      isCheckingRef.current = false;
    }
  }, [user?.id]); // Only depend on user.id to prevent recreation loops

  useEffect(() => {
    mountedRef.current = true;
    
    if (!loading && user && !hasChecked) {
      console.log('👤 User state ready, checking specialist status:', { user: user?.id, loading });
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

  const handleLogin = useCallback(() => {
    console.log('🔄 Login handler called');
    // Reset states and re-check
    setIsVerifiedSpecialist(false);
    setHasChecked(false);
    setError(null);
    isCheckingRef.current = false;
  }, []);

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
        <Loader2 className="h-8 w-8 animate-spin text-construction" />
      </div>
    );
  }

  // Show login if no user or not verified specialist
  if (!user || !isVerifiedSpecialist) {
    return <SpecialistLogin onLogin={handleLogin} onBack={() => window.history.back()} />;
  }

  return (
    <ErrorBoundary>
      <PeerSpecialistDashboard />
    </ErrorBoundary>
  );
};

export default PeerSpecialistPortal;
