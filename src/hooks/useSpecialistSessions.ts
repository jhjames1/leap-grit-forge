
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { realtimeService, RealtimeEventHandler } from '@/services/realtimeService';

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
  end_reason?: string;
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
  
  const subscriptionRefs = useRef<string[]>([]);
  const mountedRef = useRef(true);
  const endedSessionTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

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

  // Set up real-time subscription using centralized service
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !specialistId || subscriptionRefs.current.length > 0) return;
    
    logger.debug('Setting up real-time subscription for specialist sessions');
    setRealtimeStatus('connecting');
    
    // Use a consistent channel name for all waiting sessions
    const channelName = `all-chat-sessions`;
    
    // Handler for session inserts - specifically looking for waiting sessions
    const handleSessionInsert: RealtimeEventHandler = async (payload) => {
      logger.debug('🟢 SPECIALIST: New session detected via realtime:', payload.new);
      const newSession = payload.new as ChatSession;
      
      // Process all waiting sessions (unassigned) and sessions assigned to this specialist
      if (newSession.status === 'waiting' && !newSession.specialist_id) {
        logger.debug('🟢 SPECIALIST: Processing new waiting session:', newSession.id);
        
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
            logger.debug('🟢 SPECIALIST: Adding new waiting session to list:', sessionWithProfile.id);
            return [sessionWithProfile, ...prevSessions];
          }
          return prevSessions;
        });
      } else if (newSession.specialist_id === specialistId) {
        logger.debug('🟢 SPECIALIST: Processing session assigned to this specialist:', newSession.id);
        
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
            logger.debug('🟢 SPECIALIST: Adding assigned session to list:', sessionWithProfile.id);
            return [sessionWithProfile, ...prevSessions];
          }
          return prevSessions;
        });
      }
    };
    
    // Handler for session updates
    const handleSessionUpdate: RealtimeEventHandler = async (payload) => {
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
      
      // Handle ended sessions - keep them visible for 15 seconds
      if (sessionWithProfile.status === 'ended') {
        // Clear any existing timer for this session
        const existingTimer = endedSessionTimers.current.get(sessionWithProfile.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // Set up timer to remove session after 15 seconds
        const removeTimer = setTimeout(() => {
          setSessions(prevSessions => {
            logger.debug('🕒 Removing ended session after 15 seconds:', sessionWithProfile.id);
            return prevSessions.filter(session => session.id !== sessionWithProfile.id);
          });
          endedSessionTimers.current.delete(sessionWithProfile.id);
        }, 15000);
        
        endedSessionTimers.current.set(sessionWithProfile.id, removeTimer);
      }
      
      // Update sessions using functional update
      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.id === updatedSession.id) {
            return sessionWithProfile;
          }
          return session;
        }).filter(session => {
          // Don't immediately remove ended sessions - let the timer handle it
          // Remove sessions assigned to other specialists
          if (session.specialist_id && session.specialist_id !== specialistId && session.status !== 'waiting') return false;
          return true;
        });
      });
    };
    
    // Subscribe to session inserts
    const insertSubscriptionId = realtimeService.subscribe(
      channelName,
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_sessions'
      },
      handleSessionInsert
    );
    
    // Subscribe to session updates
    const updateSubscriptionId = realtimeService.subscribe(
      channelName,
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions'
      },
      handleSessionUpdate
    );
    
    subscriptionRefs.current = [insertSubscriptionId, updateSubscriptionId];
    
    // Monitor connection status
    const checkConnection = () => {
      const status = realtimeService.getConnectionStatus();
      if (mountedRef.current) {
        if (status.isConnected) {
          setRealtimeStatus('connected');
        } else if (status.totalSubscriptions > 0) {
          setRealtimeStatus('connecting');
        } else {
          setRealtimeStatus('disconnected');
        }
      }
    };
    
    // Check connection status periodically
    const statusInterval = setInterval(checkConnection, 1000);
    checkConnection();
    
    // Store interval reference for cleanup
    (subscriptionRefs.current as any).statusInterval = statusInterval;
  }, [user, specialistId]);

  // Clean up subscription and timers
  const cleanupSubscription = useCallback(() => {
    if (subscriptionRefs.current.length > 0) {
      logger.debug('Cleaning up specialist sessions subscription');
      subscriptionRefs.current.forEach(subscriptionId => {
        realtimeService.unsubscribe(subscriptionId, () => {});
      });
      
      // Clear status interval if it exists
      const statusInterval = (subscriptionRefs.current as any).statusInterval;
      if (statusInterval) {
        clearInterval(statusInterval);
      }
      
      subscriptionRefs.current = [];
    }
    
    // Clear all pending ended session timers
    endedSessionTimers.current.forEach((timer) => {
      clearTimeout(timer);
    });
    endedSessionTimers.current.clear();
  }, []);

  // Initialize and manage subscriptions with 15-second refresh
  useEffect(() => {
    mountedRef.current = true;
    let pollInterval: NodeJS.Timeout;
    
    if (user && specialistId) {
      // Initial load
      refreshSessions();
      
      // Set up 15-second polling for reliable updates
      pollInterval = setInterval(() => {
        logger.debug('15-second refresh: Reloading sessions');
        refreshSessions();
      }, 15000);
      
      // Set up real-time subscription as additional layer
      setupRealtimeSubscription();
    }
    
    return () => {
      mountedRef.current = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
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
