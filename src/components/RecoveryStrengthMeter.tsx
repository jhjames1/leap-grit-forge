import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, Activity, Target, Zap, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackingManager } from '@/utils/trackingManager';

interface RecoveryStrengthMeterProps {
  onNavigate?: (page: string) => void;
}

const RecoveryStrengthMeter = ({ onNavigate }: RecoveryStrengthMeterProps) => {
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const { userData } = useUserData();
  const { t } = useLanguage();

  useEffect(() => {
    if (userData) {
      try {
        const stats = trackingManager.getTodaysStats();
        const streak = trackingManager.getStreakData();
        setDailyStats(stats);
        setStreakData(streak);
      } catch (error) {
        console.error('Failed to load tracking stats:', error);
      }
    }
  }, [userData]);

  if (!dailyStats || !streakData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading recovery strength...</p>
        </div>
      </div>
    );
  }

  const getWellnessIcon = (level: string) => {
    switch (level) {
      case 'Good': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'Fair': return <AlertTriangle className="text-yellow-500" size={20} />;
      default: return <XCircle className="text-red-500" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">RECOVERY</span>
            <span className="font-fjalla font-extrabold italic">STRENGTH</span>
          </h1>
          <p className="text-muted-foreground font-oswald">Track your daily wellness</p>
        </div>

        <Card className="bg-card p-6 rounded-lg border-0 shadow-sm mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-primary p-3 rounded-lg">
              <Shield className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h2 className="font-fjalla font-bold text-xl uppercase tracking-wide">Recovery Strength</h2>
              <p className="text-muted-foreground text-sm">Based on your daily activities</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Today's Strength</span>
              <span className="text-2xl font-bold text-foreground">{dailyStats.recoveryStrength}%</span>
            </div>
            <Progress value={dailyStats.recoveryStrength} className="h-4" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getWellnessIcon(dailyStats.wellnessLevel)}
              <span className="font-medium text-foreground">Wellness Level</span>
            </div>
            <Badge className="font-medium">{dailyStats.wellnessLevel}</Badge>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Activity className="text-white" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{dailyStats.actionsToday}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Actions Today</div>
              </div>
            </div>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Zap className="text-white" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{dailyStats.toolsUsedToday}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Tools Used</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-primary text-primary-foreground p-4 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors duration-200"
            onClick={() => onNavigate?.('journey')}
          >
            <div className="text-center">
              <Target className="w-6 h-6 mx-auto mb-2" />
              <h3 className="font-fjalla font-bold text-sm uppercase tracking-wide">Continue Journey</h3>
            </div>
          </Card>

          <Card 
            className="bg-card p-4 rounded-lg cursor-pointer hover:bg-accent transition-colors duration-200 border"
            onClick={() => onNavigate?.('toolbox')}
          >
            <div className="text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-foreground" />
              <h3 className="font-fjalla font-bold text-sm uppercase tracking-wide text-foreground">Use Tools</h3>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecoveryStrengthMeter;