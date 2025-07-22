import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First try to get from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else if (profileError?.code === 'PGRST116') {
          // No profile found, try to get from peer_specialists
          const { data: specialistData, error: specialistError } = await supabase
            .from('peer_specialists')
            .select('id, user_id, first_name, last_name, email, updated_at')
            .eq('user_id', user.id)
            .single();

          if (specialistData) {
            setProfile({
              id: specialistData.id,
              user_id: specialistData.user_id,
              first_name: specialistData.first_name,
              last_name: specialistData.last_name,
              email: specialistData.email,
              updated_at: specialistData.updated_at
            });
          } else {
            // Create a basic profile from auth user data
            setProfile({
              id: user.id,
              user_id: user.id,
              first_name: user.email?.split('@')[0] || 'User',
              email: user.email,
              updated_at: new Date().toISOString()
            });
          }
        } else {
          throw profileError;
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        // Fallback profile
        setProfile({
          id: user.id,
          user_id: user.id,
          first_name: user.email?.split('@')[0] || 'User',
          email: user.email,
          updated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  return { profile, loading, error };
};