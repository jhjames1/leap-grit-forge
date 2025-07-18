
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

  return (
    <div className="bg-muted/50 p-3 rounded-sm">
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-card-foreground">
            {formatValue(value)}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">
            {title}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {description} (Goal: {goalText})
          </div>
          {isBelowGoal && (
            <div className="flex items-start gap-1 mt-2 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{coachingTip}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
