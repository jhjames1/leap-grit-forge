
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SpecialistMetrics {
  specialist_id: string;
  chat_completion_rate?: number;
  checkin_completion_rate?: number;
  avg_user_rating?: number;
  avg_streak_impact?: number;
  avg_response_time_seconds?: number;
  total_sessions?: number;
  total_checkins?: number;
  total_ratings?: number;
  last_updated?: string;
}

export const useSpecialistMetrics = (specialistId: string) => {
  const [metrics, setMetrics] = useState<SpecialistMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchLiveMetrics = useCallback(async () => {
    if (!specialistId) return;

    setLoading(true);
    try {
      // Get yesterday's date to ensure we only count complete days
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);
      
      // 1. Chat Sessions Metrics (cumulative up to yesterday)
      const { data: chatSessions, error: chatError } = await supabase
        .from('chat_sessions')
        .select('id, status, created_at, ended_at')
        .eq('specialist_id', specialistId)
        .lte('created_at', yesterday.toISOString());

      if (chatError) throw chatError;

      // 2. Check-ins Metrics (cumulative up to yesterday)
      const { data: checkins, error: checkinError } = await supabase
        .from('peer_checkins')
        .select('id, status, scheduled_at, completed_at')
        .eq('peer_id', specialistId)
        .lte('scheduled_at', yesterday.toISOString());

      if (checkinError) throw checkinError;

      // 3. User Ratings (cumulative up to yesterday)
      const { data: ratings, error: ratingsError } = await supabase
        .from('peer_session_ratings')
        .select('rating, created_at')
        .eq('peer_id', specialistId)
        .lte('created_at', yesterday.toISOString());

      if (ratingsError) throw ratingsError;

      // 4. Response Time from Messages (cumulative up to yesterday)
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          content,
          created_at,
          sender_type,
          session_id,
          chat_sessions!inner(specialist_id)
        `)
        .eq('chat_sessions.specialist_id', specialistId)
        .lte('created_at', yesterday.toISOString())
        .order('created_at');

      if (messagesError) throw messagesError;

      // Calculate metrics
      const totalSessions = chatSessions?.length || 0;
      const completedSessions = chatSessions?.filter(s => s.status === 'ended').length || 0;
      const chatCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      const totalCheckins = checkins?.length || 0;
      const completedCheckins = checkins?.filter(c => c.status === 'completed').length || 0;
      const checkinCompletionRate = totalCheckins > 0 ? (completedCheckins / totalCheckins) * 100 : 0;

      const totalRatings = ratings?.length || 0;
      const avgUserRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;

      // Calculate response times
      let avgResponseTime = 0;
      if (messages && messages.length > 0) {
        const responseTimes: number[] = [];
        
        // Group messages by session
        const sessionMessages = messages.reduce((acc, msg) => {
          if (!acc[msg.session_id]) acc[msg.session_id] = [];
          acc[msg.session_id].push(msg);
          return acc;
        }, {} as Record<string, typeof messages>);

        // Calculate response times for each session
        Object.values(sessionMessages).forEach(sessionMsgs => {
          for (let i = 0; i < sessionMsgs.length - 1; i++) {
            const currentMsg = sessionMsgs[i];
            const nextMsg = sessionMsgs[i + 1];
            
            if (currentMsg.sender_type === 'user' && nextMsg.sender_type === 'specialist') {
              const responseTime = new Date(nextMsg.created_at).getTime() - new Date(currentMsg.created_at).getTime();
              responseTimes.push(responseTime / 1000); // Convert to seconds
            }
          }
        });

        if (responseTimes.length > 0) {
          avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        }
      }

      // Calculate streak impact (improved calculation based on session completion)
      const avgStreakImpact = totalSessions > 0 
        ? (chatCompletionRate > 75 ? 1.5 : chatCompletionRate > 50 ? 0.5 : -0.2)
        : 0;

      const calculatedMetrics: SpecialistMetrics = {
        specialist_id: specialistId,
        chat_completion_rate: Math.round(chatCompletionRate * 10) / 10,
        checkin_completion_rate: Math.round(checkinCompletionRate * 10) / 10,
        avg_user_rating: Math.round(avgUserRating * 10) / 10,
        avg_streak_impact: Math.round(avgStreakImpact * 10) / 10,
        avg_response_time_seconds: Math.round(avgResponseTime * 10) / 10,
        total_sessions: totalSessions,
        total_checkins: totalCheckins,
        total_ratings: totalRatings,
        last_updated: new Date().toISOString(),
      };

      setMetrics(calculatedMetrics);
      setLastFetched(new Date());

    } catch (error) {
      console.error('Error fetching live specialist metrics:', error);
      setMetrics({
        specialist_id: specialistId,
        chat_completion_rate: 0,
        checkin_completion_rate: 0,
        avg_user_rating: 0,
        avg_streak_impact: 0,
        avg_response_time_seconds: 0,
        total_sessions: 0,
        total_checkins: 0,
        total_ratings: 0,
        last_updated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [specialistId]);

  useEffect(() => {
    if (!specialistId) return;

    // Initial fetch
    fetchLiveMetrics();

    // Only set up selective real-time subscriptions for meaningful changes
    const chatSessionsChannel = supabase
      .channel(`specialist_${specialistId}_sessions`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_sessions',
          filter: `specialist_id=eq.${specialistId}`
        }, 
        (payload) => {
          // Only refresh if status changed to 'ended' (completion matters for metrics)
          if (payload.new.status === 'ended' && payload.old.status !== 'ended') {
            console.log('Session completed, refreshing metrics...');
            fetchLiveMetrics();
          }
        }
      )
      .subscribe();

    const checkinsChannel = supabase
      .channel(`specialist_${specialistId}_checkins`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'peer_checkins',
          filter: `peer_id=eq.${specialistId}`
        }, 
        (payload) => {
          // Only refresh if status changed to 'completed'
          if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
            console.log('Check-in completed, refreshing metrics...');
            fetchLiveMetrics();
          }
        }
      )
      .subscribe();

    const ratingsChannel = supabase
      .channel(`specialist_${specialistId}_ratings`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'peer_session_ratings',
          filter: `peer_id=eq.${specialistId}`
        }, 
        () => {
          console.log('New rating received, refreshing metrics...');
          fetchLiveMetrics();
        }
      )
      .subscribe();

    // Check once per hour if it's a new day (metrics should refresh at midnight)
    const checkForNewDay = () => {
      if (lastFetched) {
        const now = new Date();
        const lastFetchDate = new Date(lastFetched);
        
        // If it's a new day since last fetch, refresh metrics
        if (now.getDate() !== lastFetchDate.getDate() || 
            now.getMonth() !== lastFetchDate.getMonth() || 
            now.getFullYear() !== lastFetchDate.getFullYear()) {
          console.log('New day detected, refreshing metrics...');
          fetchLiveMetrics();
        }
      }
    };

    // Check for new day every hour instead of every minute
    const intervalId = setInterval(checkForNewDay, 60 * 60 * 1000); // 1 hour

    return () => {
      supabase.removeChannel(chatSessionsChannel);
      supabase.removeChannel(checkinsChannel);
      supabase.removeChannel(ratingsChannel);
      clearInterval(intervalId);
    };
  }, [specialistId, fetchLiveMetrics]);

  return { 
    metrics, 
    loading, 
    lastFetched,
    refreshMetrics: fetchLiveMetrics
  };
};
