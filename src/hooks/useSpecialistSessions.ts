
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  session_number: number;
  user_first_name?: string;
  user_last_name?: string;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

interface UseSpecialistSessionsReturn {
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  refreshSessions: () => Promise<void>;
}

export const useSpecialistSessions = (specialistId: string | null): UseSpecialistSessionsReturn => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Function to load sessions from database
  const loadSessions = useCallback(async (): Promise<ChatSession[]> => {
    if (!user || !specialistId) return [];
    
    try {
      logger.debug('Loading sessions for specialist:', specialistId);
      setError(null);

      // Get waiting sessions (unassigned)
      const { data: waitingSessions, error: waitingError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'waiting')
        .is('specialist_id', null)
        .order('started_at', { ascending: false });
      
      if (waitingError) throw waitingError;

      // Get specialist's own active sessions
      const { data: activeSessions, error: activeError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('status', 'active')
        .order('started_at', { ascending: false });
      
      if (activeError) throw activeError;

      // Get user profiles for all sessions
      const allSessionData = [...(waitingSessions || []), ...(activeSessions || [])];
      const userIds = allSessionData.map(s => s.user_id);
      
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      // Combine sessions with profile data
      const sessionsWithProfiles = allSessionData.map(session => {
        const profile = profiles?.find(p => p.user_id === session.user_id);
        return {
          ...session,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name
        } as ChatSession;
      });

      // Sort by most recent activity
      return sessionsWithProfiles.sort((a, b) => 
        new Date(b.updated_at || b.started_at).getTime() - new Date(a.updated_at || a.started_at).getTime()
      );
    } catch (err) {
      logger.error('Error loading sessions:', err);
      throw err;
    }
  }, [user, specialistId]);

  // Refresh sessions function
  const refreshSessions = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    try {
      const newSessions = await loadSessions();
      if (mountedRef.current) {
        setSessions(newSessions);
        logger.debug('Sessions refreshed:', newSessions.length);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadSessions]);

  // Set up real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !specialistId || channelRef.current) return;
    
    logger.debug('Setting up real-time subscription for specialist sessions');
    setRealtimeStatus('connecting');
    
    // Use a consistent channel name for this specialist
    const channelName = `specialist-sessions-${specialistId}`;
    const channel = supabase.channel(channelName);
    
    // Listen for new chat sessions
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_sessions'
    }, async (payload) => {
      logger.debug('New session detected via realtime:', payload.new);
      const newSession = payload.new as ChatSession;
      
      // Only process waiting sessions or sessions assigned to this specialist
      if (newSession.status === 'waiting' || newSession.specialist_id === specialistId) {
        // Get user profile for the new session
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', newSession.user_id)
          .single();
        
        const sessionWithProfile = {
          ...newSession,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name
        };
        
        // Update sessions using functional update to avoid stale closures
        setSessions(prevSessions => {
          const exists = prevSessions.find(s => s.id === newSession.id);
          if (!exists) {
            logger.debug('Adding new session to list:', sessionWithProfile.id);
            return [sessionWithProfile, ...prevSessions];
          }
          return prevSessions;
        });
      }
    });
    
    // Listen for session updates
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions'
    }, async (payload) => {
      logger.debug('Session updated via realtime:', payload.new);
      const updatedSession = payload.new as ChatSession;
      
      // Get user profile if not already present
      let sessionWithProfile = updatedSession;
      if (!updatedSession.user_first_name) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', updatedSession.user_id)
          .single();
        
        sessionWithProfile = {
          ...updatedSession,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name
        };
      }
      
      // Update sessions using functional update
      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.id === updatedSession.id) {
            return sessionWithProfile;
          }
          return session;
        }).filter(session => {
          // Remove sessions that are no longer relevant
          if (session.status === 'ended') return false;
          if (session.specialist_id && session.specialist_id !== specialistId) return false;
          return true;
        });
      });
    });
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      logger.debug('Specialist sessions realtime status:', status);
      if (mountedRef.current) {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          logger.debug('Specialist sessions realtime connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('disconnected');
          logger.debug('Specialist sessions realtime disconnected, status:', status);
          
          // Clean up and retry after delay
          setTimeout(() => {
            if (mountedRef.current && channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
              setupRealtimeSubscription();
            }
          }, 5000);
        } else {
          setRealtimeStatus('connecting');
        }
      }
    });
    
    channelRef.current = channel;
  }, [user, specialistId]);

  // Clean up subscription
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      logger.debug('Cleaning up specialist sessions subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Initialize and manage subscriptions
  useEffect(() => {
    mountedRef.current = true;
    
    if (user && specialistId) {
      // Initial load
      refreshSessions();
      
      // Set up real-time subscription
      setupRealtimeSubscription();
    }
    
    return () => {
      mountedRef.current = false;
      cleanupSubscription();
    };
  }, [user, specialistId, refreshSessions, setupRealtimeSubscription, cleanupSubscription]);

  // Fallback polling when realtime is disconnected
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (realtimeStatus === 'disconnected' && user && specialistId) {
      logger.debug('Realtime disconnected, starting fallback polling');
      intervalId = setInterval(() => {
        refreshSessions();
      }, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [realtimeStatus, user, specialistId, refreshSessions]);

  return {
    sessions,
    isLoading,
    error,
    realtimeStatus,
    refreshSessions
  };
};
