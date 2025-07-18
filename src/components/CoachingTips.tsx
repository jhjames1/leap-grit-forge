import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CoachingTipsProps {
  specialistId: string;
}

const CoachingTips = ({ specialistId }: CoachingTipsProps) => {
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    fetchCoachingTips();
  }, [specialistId]);

  const fetchCoachingTips = async () => {
    try {
      const { data: metrics } = await supabase
        .from('peer_monthly_metrics')
        .select('*')
        .eq('peer_id', specialistId)
        .order('month', { ascending: false })
        .limit(1);

      if (!metrics || metrics.length === 0) {
        setTips(["Focus on establishing consistent communication patterns with users"]);
        return;
      }

      const latest = metrics[0];
      const generatedTips: string[] = [];

      if ((latest.chat_completion_rate || 0) < 80) {
        generatedTips.push("Improve chat completion rates by setting clear session goals at the start");
      }
      if ((latest.avg_user_rating || 0) < 4) {
        generatedTips.push("Focus on active listening and empathy to improve user satisfaction");
      }
      if ((latest.avg_response_time_seconds || 0) > 60) {
        generatedTips.push("Aim for quicker response times to maintain user engagement");
      }
      if ((latest.checkin_completion_rate || 0) < 90) {
        generatedTips.push("Set regular reminders for user check-ins to improve completion rates");
      }

      setTips(generatedTips.length > 0 ? generatedTips : ["Keep up the excellent work! Your performance metrics are strong"]);
    } catch (error) {
      console.error('Error generating coaching tips:', error);
      setTips(["Focus on maintaining consistent communication with your assigned users"]);
    }
  };

  return (
    <div className="pt-4 border-t border-muted/30">
      <h5 className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Coaching Tips
      </h5>
      <div className="space-y-1">
        {tips.map((tip, index) => (
          <div key={index} className="text-xs bg-muted/50 rounded p-2">
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachingTips;