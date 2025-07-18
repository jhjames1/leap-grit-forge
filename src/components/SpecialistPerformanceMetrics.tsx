import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';
import { Star, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface SpecialistPerformanceMetricsProps {
  specialistId: string;
  month?: string;
}

const SpecialistPerformanceMetrics = ({ specialistId, month }: SpecialistPerformanceMetricsProps) => {
  const { metrics, loading } = useSpecialistMetrics(specialistId, month);

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
        <p className="text-sm font-medium text-muted-foreground">Performance Metrics</p>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-2"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Performance Metrics</p>
        <p className="text-xs text-muted-foreground">No data available for current month</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Performance Metrics</p>
      <div className="grid grid-cols-2 gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chat Rate</p>
                <Badge 
                  variant={getMetricBadgeVariant(metrics.chat_completion_rate, 75)}
                  className="text-xs"
                >
                  {metrics.chat_completion_rate?.toFixed(0) || '0'}%
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat completion rate (Target ≥ 75%)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Check-ins</p>
                <Badge 
                  variant={getMetricBadgeVariant(metrics.checkin_completion_rate, 75)}
                  className="text-xs"
                >
                  {metrics.checkin_completion_rate?.toFixed(0) || '0'}%
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Check-in completion rate (Target ≥ 75%)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Rating</p>
                <Badge 
                  variant={getMetricBadgeVariant(metrics.avg_user_rating, 4.5)}
                  className="text-xs flex items-center gap-1"
                >
                  <Star className="h-3 w-3 fill-current" />
                  {metrics.avg_user_rating?.toFixed(1) || '0.0'}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average user rating (Target ≥ 4.5★)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Response</p>
                <Badge 
                  variant={getMetricBadgeVariant(metrics.avg_response_time_seconds, 45, true)}
                  className="text-xs flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {formatResponseTime(metrics.avg_response_time_seconds)}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average response time (Target ≤ 45s)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Streak Impact</p>
              <Badge 
                variant={getMetricBadgeVariant(metrics.avg_streak_impact, 1)}
                className="text-xs flex items-center gap-1 w-fit"
              >
                {(metrics.avg_streak_impact || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {(metrics.avg_streak_impact || 0) >= 0 ? '+' : ''}{metrics.avg_streak_impact?.toFixed(1) || '0.0'}d
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recovery streak impact (Target ≥ +1d)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SpecialistPerformanceMetrics;