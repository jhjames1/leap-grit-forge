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

  useEffect(() => {
    const checkSpecialistStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is a verified peer specialist
        const { data: specialistData, error } = await supabase
          .from('peer_specialists')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('is_verified', true)
          .single();

        if (!error && specialistData) {
          setIsVerifiedSpecialist(true);
        }
      } catch (error) {
        console.error('Error checking specialist status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSpecialistStatus();
  }, [user]);

  const handleLogin = () => {
    // Re-check specialist status after login
    setIsLoading(true);
    setIsVerifiedSpecialist(false);
    
    setTimeout(() => {
      if (user) {
        checkSpecialistStatus();
      }
    }, 100);
  };

  const checkSpecialistStatus = async () => {
    if (!user) return;

    try {
      const { data: specialistData, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_verified', true)
        .single();

      if (!error && specialistData) {
        setIsVerifiedSpecialist(true);
      }
    } catch (error) {
      console.error('Error checking specialist status:', error);
    } finally {
      setIsLoading(false);
    }
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