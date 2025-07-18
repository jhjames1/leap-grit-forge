
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';

interface CoachingTipsProps {
  specialistId: string;
}

const CoachingTips = ({ specialistId }: CoachingTipsProps) => {
  const [tips, setTips] = useState<string[]>([]);
  const { metrics, loading } = useSpecialistMetrics(specialistId);

  useEffect(() => {
    if (!metrics && !loading) {
      setTips(["Focus on establishing consistent communication patterns with users"]);
      return;
    }

    if (metrics) {
      const generatedTips: string[] = [];

      if ((metrics.chat_completion_rate || 0) < 75) {
        generatedTips.push("Improve chat completion rates by setting clear session goals at the start");
      }
      if ((metrics.avg_user_rating || 0) < 4.5) {
        generatedTips.push("Focus on active listening and empathy to improve user satisfaction");
      }
      if ((metrics.avg_response_time_seconds || 0) > 45) {
        generatedTips.push("Aim for quicker response times to maintain user engagement");
      }
      if ((metrics.checkin_completion_rate || 0) < 75) {
        generatedTips.push("Set regular reminders for user check-ins to improve completion rates");
      }
      if ((metrics.avg_streak_impact || 0) < 1) {
        generatedTips.push("Focus on providing more impactful support to help users maintain their recovery streaks");
      }

      setTips(generatedTips.length > 0 ? generatedTips : ["Keep up the excellent work! Your performance metrics are strong"]);
    }
  }, [metrics, loading]);

  if (loading) {
    return (
      <div className="pt-4 border-t border-muted/30">
        <h5 className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Coaching Tips
        </h5>
        <div className="animate-pulse">
          <div className="h-8 bg-muted/50 rounded mb-1"></div>
          <div className="h-8 bg-muted/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-muted/30">
      <h5 className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Real-time Coaching Tips
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
