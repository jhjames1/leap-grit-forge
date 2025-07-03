
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap, Target } from 'lucide-react';
import { RecoveryStrengthData, getRecoveryStrengthLabel, getRecoveryStrengthMessage } from '@/utils/recoveryStrength';

interface RecoveryStrengthMeterProps {
  data: RecoveryStrengthData;
}

const RecoveryStrengthMeter = ({ data }: RecoveryStrengthMeterProps) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    // Animate the percentage display
    const timer = setTimeout(() => {
      setDisplayPercentage(data.overall);
    }, 300);
    return () => clearTimeout(timer);
  }, [data.overall]);

  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'from-construction to-construction-light';
    if (percentage >= 60) return 'from-construction/80 to-construction';
    if (percentage >= 40) return 'from-steel to-construction/60';
    return 'from-steel-dark to-steel';
  };

  const getIconColor = (percentage: number) => {
    if (percentage >= 80) return 'text-construction';
    if (percentage >= 60) return 'text-construction/80';
    return 'text-steel-light';
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`bg-gradient-to-r ${getColorClass(data.overall)} p-2 rounded-lg`}>
            <TrendingUp className="text-midnight" size={20} />
          </div>
          <div>
            <h3 className="font-oswald font-semibold text-white">
              {getRecoveryStrengthLabel(data.overall)}
            </h3>
            <p className="text-steel-light text-sm">
              This week's level: <span className={`font-bold ${getIconColor(data.overall)}`}>{displayPercentage}%</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-anton text-construction">{displayPercentage}</div>
          <div className="text-xs text-steel-light font-oswald">STRENGTH</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <Progress value={displayPercentage} className="h-3 bg-steel-dark">
          <div 
            className={`h-full bg-gradient-to-r ${getColorClass(data.overall)} rounded-full transition-all duration-1000`}
            style={{ width: `${displayPercentage}%` }}
          />
        </Progress>
        <p className="text-steel-light text-sm text-center">
          {getRecoveryStrengthMessage(data.overall)}
        </p>
      </div>

      {/* Recent Changes */}
      {data.recentChanges.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-oswald font-medium text-white text-sm mb-2">Recent Progress</h4>
          {data.recentChanges.slice(-3).map((change, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${change.change > 0 ? 'bg-construction' : 'bg-steel'}`}></div>
                <span className="text-steel-light">{change.action}</span>
              </div>
              <span className={`font-oswald font-medium ${change.change > 0 ? 'text-construction' : 'text-steel-light'}`}>
                {change.change > 0 ? '+' : ''}{change.change}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecoveryStrengthMeter;
