import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PeerSpecialist {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  specialties: string[];
  years_experience: number;
  avatar_url: string | null;
  is_verified: boolean;
  status: {
    status: 'online' | 'away' | 'offline' | 'busy';
    status_message: string | null;
    last_seen: string;
  };
}

export function usePeerSpecialists() {
  const [specialists, setSpecialists] = useState<PeerSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpecialists();
    
    // Set up real-time subscription for status changes
    const statusChannel = supabase
      .channel('specialist-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_status'
        },
        (payload) => {
          console.log('Status change detected:', payload);
          fetchSpecialists(); // Refetch when status changes
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription active for specialist status');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
        }
      });

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, []);

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('peer_specialists')
        .select(`
          *,
          specialist_status!inner (
            status,
            status_message,
            last_seen
          )
        `)
        .eq('is_active', true)
        .order('created_at');

      if (fetchError) throw fetchError;

      const formattedSpecialists: PeerSpecialist[] = (data || []).map(specialist => ({
        id: specialist.id,
        first_name: specialist.first_name,
        last_name: specialist.last_name,
        bio: specialist.bio,
        specialties: specialist.specialties || [],
        years_experience: specialist.years_experience || 0,
        avatar_url: specialist.avatar_url,
        is_verified: specialist.is_verified,
        status: {
          status: (specialist.specialist_status?.status as 'online' | 'away' | 'offline' | 'busy') || 'offline',
          status_message: specialist.specialist_status?.status_message || null,
          last_seen: specialist.specialist_status?.last_seen || new Date().toISOString()
        }
      }));

      setSpecialists(formattedSpecialists);
    } catch (err) {
      console.error('Error fetching specialists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch specialists');
    } finally {
      setLoading(false);
    }
  };

  return {
    specialists,
    loading,
    error,
    refetch: fetchSpecialists
  };
}