
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';
import { Star, Clock, TrendingUp, TrendingDown, RefreshCw, Activity, MessageSquare } from 'lucide-react';
import { PERFORMANCE_GOALS, getGoalText } from '@/utils/performanceGoals';

interface RealTimeSpecialistMetricsProps {
  specialistId: string;
}

const RealTimeSpecialistMetrics = ({ specialistId }: RealTimeSpecialistMetricsProps) => {
  const { metrics, loading, lastFetched, refreshMetrics } = useSpecialistMetrics(specialistId);

  const getMetricColor = (value: number | undefined, threshold: number, isReversed = false): string => {
    if (value === undefined || value === null) return 'text-muted-foreground';
    
    if (isReversed) {
      return value <= threshold ? 'text-green-500' : 'text-red-500';
    }
    return value >= threshold ? 'text-green-500' : 'text-red-500';
  };

  const getMetricBadgeVariant = (value: number | undefined, threshold: number, isReversed = false): "default" | "secondary" | "destructive" | "outline" => {
    if (value === undefined || value === null) return 'outline';
    
    if (isReversed) {
      return value <= threshold ? 'default' : 'destructive';
    }
    return value >= threshold ? 'default' : 'destructive';
  };

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
    return `${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // Check if there's meaningful data to display
  const hasData = metrics && (
    (metrics.total_sessions || 0) > 0 || 
    (metrics.total_checkins || 0) > 0 || 
    (metrics.total_ratings || 0) > 0
  );

  if (loading && !metrics) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Live Performance Metrics</p>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-16"></div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-2"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  // If no meaningful data, show placeholder message
  if (!hasData && !loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Live Performance Metrics</p>
          <Button
            onClick={refreshMetrics}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No performance data available yet</p>
        </div>
      </div>
    );
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Live Performance Metrics</p>
        <div className="flex items-center space-x-2">
          {lastFetched && (
            <span className="text-xs text-muted-foreground">
              Updated: {formatLastUpdated(metrics?.last_updated)}
            </span>
          )}
          <Button
            onClick={refreshMetrics}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mb-2">
        Cumulative up to yesterday: {displayMetrics.total_sessions} sessions • {displayMetrics.total_checkins} check-ins • {displayMetrics.total_ratings} ratings
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chat Rate (Goal: {getGoalText('CHAT_COMPLETION_RATE')})</p>
                <Badge 
                  variant={getMetricBadgeVariant(displayMetrics.chat_completion_rate, PERFORMANCE_GOALS.CHAT_COMPLETION_RATE)}
                  className="text-xs"
                >
                  {displayMetrics.chat_completion_rate?.toFixed(0) || '0'}%
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat completion rate (Target {getGoalText('CHAT_COMPLETION_RATE')})</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Check-ins (Goal: {getGoalText('CHECKIN_COMPLETION_RATE')})</p>
                <Badge 
                  variant={getMetricBadgeVariant(displayMetrics.checkin_completion_rate, PERFORMANCE_GOALS.CHECKIN_COMPLETION_RATE)}
                  className="text-xs"
                >
                  {displayMetrics.checkin_completion_rate?.toFixed(0) || '0'}%
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Check-in completion rate (Target {getGoalText('CHECKIN_COMPLETION_RATE')})</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Rating (Goal: {getGoalText('AVG_USER_RATING')})</p>
                <Badge 
                  variant={getMetricBadgeVariant(displayMetrics.avg_user_rating, PERFORMANCE_GOALS.AVG_USER_RATING)}
                  className="text-xs flex items-center gap-1"
                >
                  <Star className="h-3 w-3 fill-current" />
                  {displayMetrics.avg_user_rating?.toFixed(1) || '0.0'}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average user rating (Target {getGoalText('AVG_USER_RATING')})</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Response (Goal: {getGoalText('AVG_RESPONSE_TIME_SECONDS')})</p>
                <Badge 
                  variant={getMetricBadgeVariant(displayMetrics.avg_response_time_seconds, PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS, true)}
                  className="text-xs flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {formatResponseTime(displayMetrics.avg_response_time_seconds)}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average response time (Target {getGoalText('AVG_RESPONSE_TIME_SECONDS')})</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Streak Impact (Goal: {getGoalText('AVG_STREAK_IMPACT')})</p>
              <Badge 
                variant={getMetricBadgeVariant(displayMetrics.avg_streak_impact, PERFORMANCE_GOALS.AVG_STREAK_IMPACT)}
                className="text-xs flex items-center gap-1 w-fit"
              >
                {(displayMetrics.avg_streak_impact || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {(displayMetrics.avg_streak_impact || 0) >= 0 ? '+' : ''}{displayMetrics.avg_streak_impact?.toFixed(1) || '0.0'}d
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recovery streak impact (Target {getGoalText('AVG_STREAK_IMPACT')})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Real-time status indicator */}
      <div className="flex items-center space-x-2 pt-2 border-t border-muted/30">
        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span className="text-xs text-muted-foreground">
          {loading ? 'Updating...' : 'Live data active'}
        </span>
      </div>
    </div>
  );
};

export default RealTimeSpecialistMetrics;
