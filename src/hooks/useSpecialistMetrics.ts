import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SpecialistMetrics {
  specialist_id: string;
  chat_completion_rate?: number;
  checkin_completion_rate?: number;
  avg_user_rating?: number;
  avg_streak_impact?: number;
  avg_response_time_seconds?: number;
}

export const useSpecialistMetrics = (specialistId: string, month?: string) => {
  const [metrics, setMetrics] = useState<SpecialistMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!specialistId) return;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const currentMonth = month || new Date().toISOString().slice(0, 7);
        const startDate = `${currentMonth}-01`;
        const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 1).toISOString().slice(0, 10);

        const { data, error } = await supabase
          .from('peer_monthly_metrics')
          .select('*')
          .eq('peer_id', specialistId)
          .gte('month', startDate)
          .lt('month', endDate)
          .maybeSingle();

        if (error) throw error;

        setMetrics(data ? {
          specialist_id: specialistId,
          chat_completion_rate: data.chat_completion_rate,
          checkin_completion_rate: data.checkin_completion_rate,
          avg_user_rating: data.avg_user_rating,
          avg_streak_impact: data.avg_streak_impact,
          avg_response_time_seconds: data.avg_response_time_seconds,
        } : null);
      } catch (error) {
        console.error('Error fetching specialist metrics:', error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [specialistId, month]);

  return { metrics, loading };
};