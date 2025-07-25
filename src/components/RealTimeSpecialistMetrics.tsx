import { Button } from '@/components/ui/button';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';
import { RefreshCw, MessageSquare, Calendar, Star, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { PERFORMANCE_GOALS, isMetricBelowGoal } from '@/utils/performanceGoals';
import MetricCard from './MetricCard';
interface RealTimeSpecialistMetricsProps {
  specialistId: string;
}
const RealTimeSpecialistMetrics = ({
  specialistId
}: RealTimeSpecialistMetricsProps) => {
  const {
    metrics,
    loading,
    lastFetched,
    refreshMetrics
  } = useSpecialistMetrics(specialistId);
  const formatResponseTime = (seconds: number | undefined): string => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  const formatLastUpdated = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return `${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  // Check if there's meaningful data to display
  const hasData = metrics && ((metrics.total_sessions || 0) > 0 || (metrics.total_checkins || 0) > 0 || (metrics.total_ratings || 0) > 0);
  if (loading && !metrics) {
    return <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Live Performance Metrics</p>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-16"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-muted/50 p-3 rounded-sm">
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>)}
        </div>
      </div>;
  }

  // If no meaningful data, show placeholder message
  if (!hasData && !loading) {
    return <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Live Performance Metrics</p>
          <Button onClick={refreshMetrics} size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No performance data available yet</p>
        </div>
      </div>;
  }
  const displayMetrics = metrics || {
    chat_completion_rate: 0,
    checkin_completion_rate: 0,
    avg_user_rating: 0,
    avg_streak_impact: 0,
    avg_response_time_seconds: 0,
    total_sessions: 0,
    total_checkins: 0,
    total_ratings: 0
  };

  // Check if all metrics meet their goals
  const allMetricsMeetGoals = !isMetricBelowGoal(displayMetrics.chat_completion_rate, 'CHAT_COMPLETION_RATE') && !isMetricBelowGoal(displayMetrics.checkin_completion_rate, 'CHECKIN_COMPLETION_RATE') && !isMetricBelowGoal(displayMetrics.avg_user_rating, 'AVG_USER_RATING') && !isMetricBelowGoal(displayMetrics.avg_response_time_seconds, 'AVG_RESPONSE_TIME_SECONDS') && !isMetricBelowGoal(displayMetrics.avg_streak_impact, 'AVG_STREAK_IMPACT');
  return <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Live Performance Metrics</p>
        
      </div>
      
      <div className="text-xs text-muted-foreground mb-3">
        Cumulative up to yesterday: {displayMetrics.total_sessions} sessions • {displayMetrics.total_checkins} check-ins • {displayMetrics.total_ratings} ratings
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        <MetricCard metricKey="CHAT_COMPLETION_RATE" value={displayMetrics.chat_completion_rate} title="Chat Rate" formatValue={value => `${value?.toFixed(0) || '0'}%`} icon={MessageSquare} />

        <MetricCard metricKey="CHECKIN_COMPLETION_RATE" value={displayMetrics.checkin_completion_rate} title="Check-ins" formatValue={value => `${value?.toFixed(0) || '0'}%`} icon={Calendar} />

        <MetricCard metricKey="AVG_USER_RATING" value={displayMetrics.avg_user_rating} title="Rating" formatValue={value => `${value?.toFixed(1) || '0.0'}`} icon={Star} />

        <MetricCard metricKey="AVG_RESPONSE_TIME_SECONDS" value={displayMetrics.avg_response_time_seconds} title="Response" formatValue={formatResponseTime} icon={Clock} />

        <MetricCard metricKey="AVG_STREAK_IMPACT" value={displayMetrics.avg_streak_impact} title="Streak Impact" formatValue={value => `${(value || 0) >= 0 ? '+' : ''}${value?.toFixed(1) || '0.0'}d`} icon={TrendingUp} />
      </div>

      {/* Success message when all metrics meet goals */}
      {allMetricsMeetGoals && hasData && <div className="bg-muted/50 p-3 rounded-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="text-sm font-medium text-green-800">
              Excellent work! All your performance metrics are meeting their goals.
            </div>
          </div>
        </div>}

      {/* Real-time status indicator */}
      
    </div>;
};
export default RealTimeSpecialistMetrics;