
import { getMetricDescription } from '@/utils/performanceGoals';

interface MetricCardProps {
  metricKey: keyof typeof import('@/utils/performanceGoals').PERFORMANCE_GOALS;
  value: number | undefined;
  title: string;
  formatValue: (value: number | undefined) => string;
  icon: React.ElementType;
}

const MetricCard = ({ metricKey, value, title, formatValue, icon: Icon }: MetricCardProps) => {
  const description = getMetricDescription(metricKey);

  return (
    <div className="bg-muted/50 p-3 rounded-sm border border-muted/30">
      <div className="space-y-1">
        <div className="text-sm font-bold text-card-foreground">
          {formatValue(value)}
        </div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">
            {title}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
