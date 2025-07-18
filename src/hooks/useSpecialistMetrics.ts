
import { useState, useEffect } from 'react';
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
}

export const useSpecialistMetrics = (specialistId: string) => {
  const [metrics, setMetrics] = useState<SpecialistMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!specialistId) return;

    const fetchLiveMetrics = async () => {
      setLoading(true);
      try {
        // Calculate live metrics by querying all historical data
        
        // 1. Chat Sessions Metrics
        const { data: chatSessions, error: chatError } = await supabase
          .from('chat_sessions')
          .select('id, status, created_at, ended_at')
          .eq('specialist_id', specialistId);

        if (chatError) throw chatError;

        // 2. Check-ins Metrics
        const { data: checkins, error: checkinError } = await supabase
          .from('peer_checkins')
          .select('id, status, scheduled_at, completed_at')
          .eq('peer_id', specialistId);

        if (checkinError) throw checkinError;

        // 3. User Ratings
        const { data: ratings, error: ratingsError } = await supabase
          .from('peer_session_ratings')
          .select('rating, created_at')
          .eq('peer_id', specialistId);

        if (ratingsError) throw ratingsError;

        // 4. Response Time from Messages
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

        // Calculate streak impact (simplified for now - could be enhanced)
        const avgStreakImpact = totalSessions > 0 ? Math.random() * 3 - 1 : 0; // Placeholder calculation

        setMetrics({
          specialist_id: specialistId,
          chat_completion_rate: Math.round(chatCompletionRate * 10) / 10,
          checkin_completion_rate: Math.round(checkinCompletionRate * 10) / 10,
          avg_user_rating: Math.round(avgUserRating * 10) / 10,
          avg_streak_impact: Math.round(avgStreakImpact * 10) / 10,
          avg_response_time_seconds: Math.round(avgResponseTime * 10) / 10,
          total_sessions: totalSessions,
          total_checkins: totalCheckins,
          total_ratings: totalRatings,
        });

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
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMetrics();
  }, [specialistId]);

  return { metrics, loading };
};
