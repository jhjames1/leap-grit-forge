import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, Users, Star, Clock, AlertTriangle, TrendingUp, Edit, RotateCcw, UserX } from 'lucide-react';
import { SpecialistAnalytics } from '@/services/adminAnalyticsService';
interface SpecialistOverviewCardsProps {
  specialistAnalytics: SpecialistAnalytics;
  onEditSpecialist?: () => void;
  onResetPassword?: () => void;
  onDeactivateSpecialist?: () => void;
}
export const SpecialistOverviewCards = ({
  specialistAnalytics,
  onEditSpecialist,
  onResetPassword,
  onDeactivateSpecialist
}: SpecialistOverviewCardsProps) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };
  const getPerformanceColor = (count: number, total: number) => {
    const percentage = total > 0 ? count / total * 100 : 0;
    if (percentage > 70) return 'text-green-500';
    if (percentage > 40) return 'text-yellow-500';
    return 'text-red-500';
  };
  return <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Specialists */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-full">
                <Users className="text-primary-foreground w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{specialistAnalytics.totalSpecialists}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Specialists
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Specialists */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-3 rounded-full">
                <UserCheck className="text-white w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{specialistAnalytics.activeSpecialists}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Currently Online
                </div>
                <div className="text-xs text-green-500">
                  {specialistAnalytics.totalSpecialists > 0 ? Math.round(specialistAnalytics.activeSpecialists / specialistAnalytics.totalSpecialists * 100) : 0}% availability
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-3 rounded-full">
                <Star className="text-white w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {specialistAnalytics.averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Avg Rating
                </div>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-3 h-3 ${star <= specialistAnalytics.averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-full">
                <Clock className="text-white w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatTime(specialistAnalytics.averageResponseTime)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Avg Response
                </div>
                <div className={`text-xs ${specialistAnalytics.averageResponseTime < 60 ? 'text-green-500' : specialistAnalytics.averageResponseTime < 300 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {specialistAnalytics.averageResponseTime < 60 ? 'Excellent' : specialistAnalytics.averageResponseTime < 300 ? 'Good' : 'Needs improvement'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-accent p-3 rounded-full">
                <TrendingUp className="text-accent-foreground w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Performance Distribution</div>
                <div className="text-xs text-muted-foreground">Team performance breakdown</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-500">
                  {specialistAnalytics.performanceDistribution.excellent}
                </div>
                <div className="text-xs text-muted-foreground">Excellent</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-500">
                  {specialistAnalytics.performanceDistribution.good}
                </div>
                <div className="text-xs text-muted-foreground">Good</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-500">
                  {specialistAnalytics.performanceDistribution.average}
                </div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">
                  {specialistAnalytics.performanceDistribution.needsAttention}
                </div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Summary */}
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-red-500 p-3 rounded-full">
                <AlertTriangle className="text-white w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Active Alerts</div>
                <div className="text-xs text-muted-foreground">Issues requiring attention</div>
              </div>
            </div>
            <div className="space-y-2">
              {specialistAnalytics.alertFlags.length === 0 ? <div className="text-sm text-green-500 text-center py-2">
                  ✓ No active alerts - All specialists performing well
                </div> : specialistAnalytics.alertFlags.slice(0, 3).map((alert, index) => <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{alert.message}</span>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'} className="ml-2">
                      {alert.severity}
                    </Badge>
                  </div>)}
              {specialistAnalytics.alertFlags.length > 3 && <div className="text-xs text-muted-foreground text-center">
                  +{specialistAnalytics.alertFlags.length - 3} more alerts
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Specialist Cards */}
      <Card>
        <CardContent className="p-6">
          
          <div className="space-y-4">
            {specialistAnalytics.specialistPerformance.map(specialist => <div key={specialist.specialistId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{specialist.name}</h3>
                    <p className="text-sm text-muted-foreground">{specialist.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={specialist.isVerified ? "default" : "secondary"}>
                        {specialist.isVerified ? "Verified" : "Pending"}
                      </Badge>
                      <Badge variant={specialist.isActive ? "default" : "destructive"}>
                        {specialist.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>)}
            {specialistAnalytics.specialistPerformance.length === 0 && <div className="text-center py-8 text-muted-foreground">
                No specialist data available
              </div>}
          </div>
        </CardContent>
      </Card>
    </div>;
};