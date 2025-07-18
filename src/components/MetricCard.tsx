
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, Star, Clock, TrendingUp, TrendingDown, MessageSquare, Calendar } from 'lucide-react';
import { PERFORMANCE_GOALS, getGoalText, getMetricDescription, getCoachingTip, isMetricBelowGoal } from '@/utils/performanceGoals';

interface MetricCardProps {
  metricKey: keyof typeof PERFORMANCE_GOALS;
  value: number | undefined;
  title: string;
  formatValue: (value: number | undefined) => string;
  icon: React.ElementType;
}

const MetricCard = ({ metricKey, value, title, formatValue, icon: Icon }: MetricCardProps) => {
  const isBelowGoal = isMetricBelowGoal(value, metricKey);
  const description = getMetricDescription(metricKey);
  const coachingTip = getCoachingTip(metricKey);
  const goalText = getGoalText(metricKey);

  const getMetricBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (value === undefined || value === null) return 'outline';
    return isBelowGoal ? 'destructive' : 'default';
  };

  return (
    <div className="space-y-2 p-3 rounded-lg border border-muted/30 bg-card">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">{title}</h4>
            <span className="text-xs text-muted-foreground">(Goal: {goalText})</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={getMetricBadgeVariant()}
                className="text-xs flex items-center gap-1 ml-2"
              >
                {metricKey === 'AVG_USER_RATING' && <Star className="h-3 w-3 fill-current" />}
                {metricKey === 'AVG_RESPONSE_TIME_SECONDS' && <Clock className="h-3 w-3" />}
                {metricKey === 'AVG_STREAK_IMPACT' && (
                  (value || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                )}
                {formatValue(value)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{description} (Target {goalText})</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {isBelowGoal && (
        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed">{coachingTip}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
