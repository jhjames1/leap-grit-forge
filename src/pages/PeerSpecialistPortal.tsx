import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SpecialistLogin from '@/components/SpecialistLogin';
import PeerSpecialistDashboard from '@/components/PeerSpecialistDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const PeerSpecialistPortal = () => {
  const { user, loading } = useAuth();
  const [isVerifiedSpecialist, setIsVerifiedSpecialist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define checkSpecialistStatus outside of useEffect to avoid recreation
  const checkSpecialistStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    console.log('🔍 Checking specialist status for user:', user.id);
    setIsLoading(true);

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

      if (!error && specialistData) {
        console.log('✅ User is verified specialist');
        setIsVerifiedSpecialist(true);
      } else {
        console.log('❌ User is not verified specialist');
        setIsVerifiedSpecialist(false);
      }
    } catch (error) {
      console.error('❌ Error checking specialist status:', error);
      setIsVerifiedSpecialist(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      console.log('👤 User state changed, checking specialist status:', { user: user?.id, loading });
      checkSpecialistStatus();
    }
  }, [user?.id, loading]); // Only depend on user.id to avoid recreation loops

  const handleLogin = () => {
    console.log('🔄 Login handler called');
    // Reset states and re-check
    setIsVerifiedSpecialist(false);
    checkSpecialistStatus();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-construction" />
      </div>
    );
  }

  if (!user || !isVerifiedSpecialist) {
    return <SpecialistLogin onLogin={handleLogin} onBack={() => window.history.back()} />;
  }

  return <PeerSpecialistDashboard />;
};

export default PeerSpecialistPortal;