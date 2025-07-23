import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  CheckCircle,
  Timer,
  Activity,
  Calendar
} from 'lucide-react';
import { SpecialistPerformance } from '@/services/adminAnalyticsService';

interface SpecialistDetailModalProps {
  specialist: SpecialistPerformance | null;
  open: boolean;
  onClose: () => void;
}

export const SpecialistDetailModal = ({ specialist, open, onClose }: SpecialistDetailModalProps) => {
  if (!specialist) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getWorkloadColor = (score: number) => {
    if (score >= 90) return 'text-red-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 30) return 'text-blue-500';
    return 'text-green-500';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            Specialist Performance Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Specialist Info Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{specialist.name}</h2>
                  <p className="text-muted-foreground">{specialist.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(specialist.status)}`}></div>
                  <span className="text-lg capitalize font-medium">{specialist.status}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Last active: {formatDate(specialist.lastActive)}
              </p>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={getPerformanceColor(specialist.performanceScore)}>
                    {specialist.performanceScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={specialist.performanceScore} className="mt-2" />
                {specialist.performanceScore < 50 && (
                  <div className="flex items-center gap-1 mt-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">Needs attention</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workload</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={getWorkloadColor(specialist.workloadScore)}>
                    {specialist.workloadScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={specialist.workloadScore} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {specialist.activeSessions} active sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {specialist.averageRating > 0 ? (
                    <div className="flex items-center gap-1">
                      <span>{specialist.averageRating.toFixed(1)}</span>
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on user feedback
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(specialist.responseTime)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Average response time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Session Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Session Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Active Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">
                    {specialist.activeSessions}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Completed Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    {specialist.completedSessions}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-500">
                    {specialist.activeSessions + specialist.completedSessions}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Session Completion Rate</span>
                  <span className="text-sm font-medium">
                    {specialist.completedSessions > 0 
                      ? Math.round((specialist.completedSessions / (specialist.activeSessions + specialist.completedSessions)) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={specialist.completedSessions > 0 
                    ? (specialist.completedSessions / (specialist.activeSessions + specialist.completedSessions)) * 100
                    : 0
                  } 
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {specialist.performanceScore >= 85 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Excellent Performance
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        This specialist is performing exceptionally well across all metrics.
                      </p>
                    </div>
                  </div>
                )}

                {specialist.workloadScore >= 90 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        High Workload Warning
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        This specialist may be overloaded. Consider redistributing sessions.
                      </p>
                    </div>
                  </div>
                )}

                {specialist.responseTime > 300 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <Timer className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        Slow Response Time
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Response time is above average. Consider checking workload or availability.
                      </p>
                    </div>
                  </div>
                )}

                {specialist.averageRating < 3 && specialist.averageRating > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Star className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                        Low User Ratings
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        User feedback indicates room for improvement. Consider additional training.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};