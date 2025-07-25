import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PhoneCallRequest {
  id: string;
  session_id: string;
  specialist_id: string;
  user_id: string;
  request_token: string;
  status: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
  initiated_at?: string;
  completed_at?: string;
  metadata?: any;
}

export function usePhoneCallRequests(sessionId?: string) {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<PhoneCallRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for active phone call requests
  const checkForActiveRequest = async () => {
    if (!user || !sessionId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('phone_call_requests')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveRequest(data);
    } catch (err) {
      console.error('Error checking for phone requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to check phone requests');
    } finally {
      setLoading(false);
    }
  };

  // Accept a phone call request
  const acceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('phone_call_requests')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
          initiated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Clear the active request since it's been accepted
      setActiveRequest(null);
      return true;
    } catch (err) {
      console.error('Error accepting phone request:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept phone request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Decline a phone call request
  const declineRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('phone_call_requests')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Clear the active request since it's been declined
      setActiveRequest(null);
      return true;
    } catch (err) {
      console.error('Error declining phone request:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline phone request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for phone call requests
  useEffect(() => {
    if (!user || !sessionId) return;

    const channel = supabase
      .channel(`phone-requests-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phone_call_requests',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Phone request update:', payload);
          checkForActiveRequest();
        }
      )
      .subscribe();

    // Check for requests on mount
    checkForActiveRequest();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionId]);

  return {
    activeRequest,
    loading,
    error,
    acceptRequest,
    declineRequest,
    refreshRequests: checkForActiveRequest
  };
}