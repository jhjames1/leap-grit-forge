
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
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

  // Determine card styling based on performance
  const getCardStyling = () => {
    if (value === undefined || value === null) {
      return "bg-muted/50 p-3 rounded-sm border border-muted/30";
    }
    
    if (isBelowGoal) {
      return "bg-red-50/80 p-3 rounded-sm border border-red-200/50";
    } else {
      return "bg-green-50/80 p-3 rounded-sm border border-green-200/50";
    }
  };

  // Determine icon color based on performance
  const getIconColor = () => {
    if (value === undefined || value === null) {
      return "text-muted-foreground";
    }
    
    if (isBelowGoal) {
      return "text-red-500";
    } else {
      return "text-green-500";
    }
  };

  return (
    <div className={`${getCardStyling()} flex-1 min-w-0`}>
      <div className="space-y-1">
        <div className="text-sm font-bold text-card-foreground">
          {formatValue(value)}
        </div>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${getIconColor()} flex-shrink-0`} />
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">
            {title}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {description} (Goal: {goalText})
        </div>
        {isBelowGoal && (
          <div className="flex items-start gap-1 mt-2 text-xs text-red-600 font-bold">
            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-500" />
            <span className="leading-relaxed">{coachingTip}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
