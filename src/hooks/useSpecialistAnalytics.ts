import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SpecialistAnalytics {
  chatsThisWeek: number;
  chatsThisMonth: number;
  chatsYearToDate: number;
  averageChatDuration: number;
  topWords: Array<{ word: string; count: number }>;
  totalMessages: number;
  responseTime: number;
  satisfactionScore: number;
  activeSessions: number;
  completedSessions: number;
  weeklyTrend: Array<{ day: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

export const useSpecialistAnalytics = () => {
  const [analytics, setAnalytics] = useState<SpecialistAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get specialist data
        const { data: specialist } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!specialist) {
          throw new Error('Specialist not found');
        }

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Fetch all chat sessions for this specialist
        const { data: sessions, error: sessionsError } = await supabase
          .from('chat_sessions')
          .select(`
            id,
            created_at,
            started_at,
            ended_at,
            status,
            chat_messages(
              id,
              content,
              created_at,
              sender_type
            )
          `)
          .eq('specialist_id', specialist.id);

        if (sessionsError) throw sessionsError;

        // Calculate analytics
        const sessionsThisWeek = sessions?.filter(s => 
          new Date(s.created_at) >= startOfWeek
        ) || [];

        const sessionsThisMonth = sessions?.filter(s => 
          new Date(s.created_at) >= startOfMonth
        ) || [];

        const sessionsThisYear = sessions?.filter(s => 
          new Date(s.created_at) >= startOfYear
        ) || [];

        // Calculate average chat duration
        const completedSessionsWithDuration = sessions?.filter(s => 
          s.ended_at && s.started_at
        ) || [];

        const totalDuration = completedSessionsWithDuration.reduce((acc, session) => {
          const start = new Date(session.started_at!);
          const end = new Date(session.ended_at!);
          return acc + (end.getTime() - start.getTime());
        }, 0);

        const averageDuration = completedSessionsWithDuration.length > 0 
          ? totalDuration / completedSessionsWithDuration.length / (1000 * 60) // Convert to minutes
          : 0;

        // Get all user messages for word analysis
        const allUserMessages = sessions?.flatMap(s => 
          s.chat_messages?.filter(m => m.sender_type === 'user').map(m => m.content) || []
        ) || [];

        // Calculate top words (simple word frequency analysis)
        const wordFreq: Record<string, number> = {};
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'them', 'us']);

        allUserMessages.forEach(message => {
          const words = message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.has(word));
          
          words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          });
        });

        const topWords = Object.entries(wordFreq)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([word, count]) => ({ word, count }));

        // Calculate weekly trend (last 7 days)
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const dayCount = sessions?.filter(s => {
            const sessionDate = new Date(s.created_at);
            return sessionDate >= dayStart && sessionDate <= dayEnd;
          }).length || 0;

          weeklyTrend.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            count: dayCount
          });
        }

        // Calculate monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const monthCount = sessions?.filter(s => {
            const sessionDate = new Date(s.created_at);
            return sessionDate >= monthStart && sessionDate <= monthEnd;
          }).length || 0;

          monthlyTrend.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            count: monthCount
          });
        }

        // Calculate total messages
        const totalMessages = sessions?.reduce((acc, session) => 
          acc + (session.chat_messages?.length || 0), 0
        ) || 0;

        // Calculate response time (simplified - time between user message and specialist response)
        const allMessages = sessions?.flatMap(s => s.chat_messages || []) || [];
        const responseTimeSum = allMessages.reduce((acc, message, index) => {
          if (message.sender_type === 'specialist' && index > 0) {
            const prevMessage = allMessages[index - 1];
            if (prevMessage && prevMessage.sender_type === 'user') {
              const responseTime = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
              return acc + responseTime;
            }
          }
          return acc;
        }, 0);

        const specialistMessageCount = allMessages.filter(m => m.sender_type === 'specialist').length;
        const averageResponseTime = specialistMessageCount > 0 
          ? responseTimeSum / specialistMessageCount / (1000 * 60) // Convert to minutes
          : 0;

        const analyticsData: SpecialistAnalytics = {
          chatsThisWeek: sessionsThisWeek.length,
          chatsThisMonth: sessionsThisMonth.length,
          chatsYearToDate: sessionsThisYear.length,
          averageChatDuration: Math.round(averageDuration),
          topWords,
          totalMessages,
          responseTime: Math.round(averageResponseTime),
          satisfactionScore: 4.8, // Mock data - would come from user feedback
          activeSessions: sessions?.filter(s => s.status === 'active').length || 0,
          completedSessions: sessions?.filter(s => s.status === 'completed').length || 0,
          weeklyTrend,
          monthlyTrend
        };

        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching specialist analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return { analytics, loading, error };
};