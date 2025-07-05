
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Battery } from 'lucide-react';

interface RecoveryData {
  currentStrength: number;
  dailyActions: number;
  weeklyGoal: number;
  trend: 'up' | 'down' | 'stable';
  yesterdayStrength?: number;
}

interface RecoveryStrengthMeterProps {
  data: RecoveryData;
}

const RecoveryStrengthMeter = ({ data }: RecoveryStrengthMeterProps) => {
  const { currentStrength, dailyActions, weeklyGoal, trend, yesterdayStrength } = data;
  const progressPercentage = Math.min((currentStrength / 100) * 100, 100);

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'stable': return 'text-construction';
      default: return 'text-construction';
    }
  };

  const getTrendSymbol = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  };

  return (
    <Card className="bg-[#1A2642]/75 backdrop-blur-sm border-steel-dark p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-construction p-2 rounded-lg">
            <Battery className="text-midnight" size={20} />
          </div>
          <div>
            <h3 className="font-oswald font-semibold text-white">Recovery Strength</h3>
            <p className="text-steel-light text-sm">Today's wellness level</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-anton text-construction">{currentStrength}%</div>
          <div className={`text-sm font-oswald ${getTrendColor()}`}>
            {getTrendSymbol()} {trend}
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <Progress value={progressPercentage} className="h-4 bg-steel-dark">
          <div 
            className="h-full bg-gradient-to-r from-[#F9D058] to-[#FBE89D] rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </Progress>
        
        <div className="flex justify-between text-sm">
          <span className="text-steel-light">Actions today:</span>
          <span className="text-construction font-oswald font-medium">{dailyActions}/{weeklyGoal}</span>
        </div>
        
        {yesterdayStrength !== undefined && (
          <div className="text-xs text-steel-light/70 mt-2">
            Yesterday's strength: {yesterdayStrength}%
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecoveryStrengthMeter;
