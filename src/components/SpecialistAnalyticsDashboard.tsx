
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Star, 
  Activity, 
  Users,
  Calendar,
  BarChart3,
  Target,
  Trophy
} from 'lucide-react';
import { useSpecialistAnalytics } from '@/hooks/useSpecialistAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface SpecialistAnalyticsDashboardProps {
  onNavigateToChat?: () => void;
}

const SpecialistAnalyticsDashboard = ({ onNavigateToChat }: SpecialistAnalyticsDashboardProps) => {
  const { analytics, loading, error } = useSpecialistAnalytics();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-fjalla font-bold">Performance Analytics</h1>
              <p className="text-muted-foreground font-source">Your performance metrics and insights</p>
            </div>
            {onNavigateToChat && (
              <Button 
                onClick={onNavigateToChat}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageSquare size={16} />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <Card className="flex items-center justify-between p-6">
            <p className="text-muted-foreground">
              {error || 'Unable to load analytics data'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.first_name || 'Specialist';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-fjalla font-bold">Performance Analytics</h1>
            <p className="text-muted-foreground font-source">
              Welcome, <span className="font-bold">{userName}</span> - Your impact in the recovery community
            </p>
          </div>
          
          {onNavigateToChat && (
            <Button 
              onClick={onNavigateToChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquare size={16} />
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Chats This Week */}
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Chats This Week</h3>
              <p className="text-muted-foreground font-source">Current week activity</p>
            </div>
            <Badge variant="default">{analytics.chatsThisWeek}</Badge>
          </Card>

          {/* Chats This Month */}
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Chats This Month</h3>
              <p className="text-muted-foreground font-source">Monthly total</p>
            </div>
            <Badge variant="secondary">{analytics.chatsThisMonth}</Badge>
          </Card>

          {/* Chats This Year */}
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Chats This Year</h3>
              <p className="text-muted-foreground font-source">Year to date total</p>
            </div>
            <Badge variant="outline">{analytics.chatsYearToDate}</Badge>
          </Card>

          {/* Average Chat Duration */}
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Avg Duration</h3>
              <p className="text-muted-foreground font-source">Minutes per session</p>
            </div>
            <Badge variant="outline">{analytics.averageChatDuration}m</Badge>
          </Card>
        </div>

        {/* Performance Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Metrics */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-fjalla font-bold">Performance Metrics</h2>
                <p className="text-sm text-muted-foreground">Key performance indicators</p>
              </div>
              <Activity size={20} className="text-muted-foreground" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="text-yellow-600" size={16} />
                  </div>
                  <div>
                    <span className="font-fjalla font-bold">Response Time</span>
                    <p className="text-sm text-muted-foreground font-source">Average response time</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{analytics.responseTime}m</span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Star className="text-purple-600" size={16} />
                  </div>
                  <div>
                    <span className="font-fjalla font-bold">Satisfaction Score</span>
                    <p className="text-sm text-muted-foreground font-source">User satisfaction rating</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{analytics.satisfactionScore}</span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="text-orange-600" size={16} />
                  </div>
                  <div>
                    <span className="font-fjalla font-bold">Active Sessions</span>
                    <p className="text-sm text-muted-foreground font-source">Currently active</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{analytics.activeSessions}</span>
              </div>
            </div>
          </Card>

          {/* Top Words Analytics */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-fjalla font-bold">User Message Analysis</h2>
                <p className="text-sm text-muted-foreground">Most frequently used words</p>
              </div>
              <BarChart3 size={20} className="text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {analytics.topWords.length > 0 ? (
                analytics.topWords.map((wordData, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-sm font-bold">{index + 1}</span>
                      </div>
                      <span className="text-foreground font-source capitalize">{wordData.word}</span>
                    </div>
                    <Badge variant="outline">{wordData.count}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-source">No chat data available yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Weekly Activity and Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Activity Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-fjalla font-bold">Weekly Activity Trend</h2>
                <p className="text-sm text-muted-foreground">Daily chat activity over the week</p>
              </div>
              <TrendingUp size={20} className="text-muted-foreground" />
            </div>
            
            <div className="flex justify-between items-end h-32 px-2">
              {analytics.weeklyTrend.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-primary rounded-t-sm mb-2 min-h-[8px] w-8"
                    style={{ 
                      height: `${Math.max(8, (day.count / Math.max(...analytics.weeklyTrend.map(d => d.count), 1)) * 96)}px` 
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                  <span className="text-xs font-bold text-foreground">{day.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Additional Insights */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-fjalla font-bold">Additional Insights</h2>
                <p className="text-sm text-muted-foreground">Key performance metrics</p>
              </div>
              <Target size={20} className="text-muted-foreground" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <span className="font-fjalla font-bold">Total Messages</span>
                    <p className="text-sm text-muted-foreground font-source">All time messages sent</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{analytics.totalMessages}</span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Trophy className="text-green-600" size={16} />
                  </div>
                  <div>
                    <span className="font-fjalla font-bold">Success Rate</span>
                    <p className="text-sm text-muted-foreground font-source">Session completion rate</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">
                  {analytics.chatsYearToDate > 0 ? Math.round((analytics.completedSessions / analytics.chatsYearToDate) * 100) : 0}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <h2 className="text-xl font-fjalla font-bold mb-4">Recent Activity</h2>
          <Card className="p-6">
            <p className="text-muted-foreground font-source">No recent activity to display.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SpecialistAnalyticsDashboard;
