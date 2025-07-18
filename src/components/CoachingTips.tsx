import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';
import { PERFORMANCE_GOALS } from '@/utils/performanceGoals';
interface CoachingTipsProps {
  specialistId: string;
}
const CoachingTips = ({
  specialistId
}: CoachingTipsProps) => {
  const [tips, setTips] = useState<string[]>([]);
  const {
    metrics,
    loading
  } = useSpecialistMetrics(specialistId);
  useEffect(() => {
    if (!metrics && !loading) {
      setTips(["Focus on establishing consistent communication patterns with users"]);
      return;
    }
    if (metrics) {
      const generatedTips: string[] = [];

      // Only show tips for metrics that fall below their goals
      if ((metrics.chat_completion_rate || 0) < PERFORMANCE_GOALS.CHAT_COMPLETION_RATE) {
        generatedTips.push("Improve chat completion rates by setting clear session goals at the start");
      }
      if ((metrics.avg_user_rating || 0) < PERFORMANCE_GOALS.AVG_USER_RATING) {
        generatedTips.push("Focus on active listening and empathy to improve user satisfaction");
      }
      if ((metrics.avg_response_time_seconds || 0) > PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS) {
        generatedTips.push("Aim for quicker response times to maintain user engagement");
      }
      if ((metrics.checkin_completion_rate || 0) < PERFORMANCE_GOALS.CHECKIN_COMPLETION_RATE) {
        generatedTips.push("Set regular reminders for user check-ins to improve completion rates");
      }
      if ((metrics.avg_streak_impact || 0) < PERFORMANCE_GOALS.AVG_STREAK_IMPACT) {
        generatedTips.push("Focus on providing more impactful support to help users maintain their recovery streaks");
      }

      // If all metrics meet goals, show positive reinforcement
      if (generatedTips.length === 0) {
        setTips(["Excellent work! All your performance metrics are meeting their goals. Keep up the great support!"]);
      } else {
        setTips(generatedTips);
      }
    }
  }, [metrics, loading]);
  if (loading) {
    return;
  }
  return <div className="pt-4 border-t border-muted/30">
      <h5 className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Real-time Coaching Tips
      </h5>
      <div className="space-y-1">
        {tips.map((tip, index) => <div key={index} className="text-xs bg-muted/50 rounded p-2">
            {tip}
          </div>)}
      </div>
    </div>;
};
export default CoachingTips;