
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingProposal {
  id: string;
  title: string;
  user_first_name?: string;
  user_last_name?: string;
  start_date: string;
  start_time: string;
  expires_at: string;
  proposed_at: string;
  status: string;
}

export function usePendingProposals(specialistId: string) {
  const [proposals, setProposals] = useState<PendingProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingProposals = async () => {
    if (!specialistId) return;

    try {
      const { data, error } = await supabase
        .from('appointment_proposals')
        .select(`
          id,
          title,
          user_id,
          start_date,
          start_time,
          expires_at,
          proposed_at,
          status,
          chat_sessions!inner(status)
        `)
        .eq('specialist_id', specialistId)
        .eq('status', 'pending')
        .in('chat_sessions.status', ['waiting', 'active'])
        .gt('expires_at', new Date().toISOString())
        .order('proposed_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = (data || []).map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const proposalsWithUserInfo = (data || []).map(proposal => {
        const userProfile = profiles?.find(p => p.user_id === proposal.user_id);
        return {
          ...proposal,
          user_first_name: userProfile?.first_name || 'Unknown',
          user_last_name: userProfile?.last_name || 'User'
        };
      });

      setProposals(proposalsWithUserInfo);
    } catch (error) {
      console.error('Error fetching pending proposals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending proposals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProposals();

    // Set up real-time subscription
    const channel = supabase
      .channel('pending-proposals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_proposals',
          filter: `specialist_id=eq.${specialistId}`
        },
        () => {
          fetchPendingProposals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [specialistId]);

  return {
    proposals,
    loading,
    pendingCount: proposals.length,
    refresh: fetchPendingProposals
  };
}
