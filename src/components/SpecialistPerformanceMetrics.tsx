
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';
import { Star, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { PERFORMANCE_GOALS, getGoalText } from '@/utils/performanceGoals';

interface SpecialistPerformanceMetricsProps {
  specialistId: string;
}

const SpecialistPerformanceMetrics = ({ specialistId }: SpecialistPerformanceMetricsProps) => {
  const { metrics, loading } = useSpecialistMetrics(specialistId);

  const getMetricColor = (value: number | undefined, threshold: number, isReversed = false): string => {
    if (value === undefined || value === null) return 'text-muted-foreground';
    
    if (isReversed) {
      return value <= threshold ? 'text-success' : 'text-destructive';
    }
    return value >= threshold ? 'text-success' : 'text-destructive';
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

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Live Performance Metrics</p>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-2"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
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
      <p className="text-sm font-medium">Live Performance Metrics</p>
      <div className="text-xs text-muted-foreground mb-2">
        {displayMetrics.total_sessions} sessions • {displayMetrics.total_checkins} check-ins • {displayMetrics.total_ratings} ratings
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
              <p>Live chat completion rate (Target {getGoalText('CHAT_COMPLETION_RATE')})</p>
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
              <p>Live check-in completion rate (Target {getGoalText('CHECKIN_COMPLETION_RATE')})</p>
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
              <p>Live average user rating (Target {getGoalText('AVG_USER_RATING')})</p>
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
              <p>Live average response time (Target {getGoalText('AVG_RESPONSE_TIME_SECONDS')})</p>
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
            <p>Live recovery streak impact (Target {getGoalText('AVG_STREAK_IMPACT')})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SpecialistPerformanceMetrics;
