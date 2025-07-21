
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

  // Function to ensure specialist has a status record
  const ensureSpecialistStatus = async (specialistId: string) => {
    try {
      const { data: existingStatus } = await supabase
        .from('specialist_status')
        .select('id')
        .eq('specialist_id', specialistId)
        .single();

      if (!existingStatus) {
        console.log(`Creating missing status record for specialist: ${specialistId}`);
        await supabase
          .from('specialist_status')
          .insert({
            specialist_id: specialistId,
            status: 'offline',
            last_seen: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error ensuring specialist status:', error);
    }
  };

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

      // Use LEFT JOIN to get specialists even without status records
      const { data, error: fetchError } = await supabase
        .from('peer_specialists')
        .select(`
          *,
          specialist_status (
            status,
            status_message,
            last_seen
          )
        `)
        .eq('is_active', true)
        .order('created_at');

      if (fetchError) throw fetchError;

      const formattedSpecialists: PeerSpecialist[] = [];

      for (const specialist of data || []) {
        // If no status record exists, create one
        if (!specialist.specialist_status) {
          await ensureSpecialistStatus(specialist.id);
        }

        const specialistData: PeerSpecialist = {
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
        };

        formattedSpecialists.push(specialistData);
      }

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
