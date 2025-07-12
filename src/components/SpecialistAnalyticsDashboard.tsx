import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen bg-background p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          {onNavigateToChat && (
            <Button 
              onClick={onNavigateToChat}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-source font-bold py-2 px-4 rounded-lg tracking-wide transition-colors duration-300"
            >
              CHAT
            </Button>
          )}
        </div>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {error || 'Unable to load analytics data'}
          </p>
        </Card>
      </div>
    );
  }

  const userName = user?.user_metadata?.first_name || 'Specialist';

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
              <span className="font-oswald font-extralight tracking-tight">ANALYTICS</span>
              <span className="font-fjalla font-extrabold italic">DASHBOARD</span>
            </h1>
            <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
              WELCOME, <span className="font-bold italic">{userName.toUpperCase()}</span>
            </p>
            <p className="text-muted-foreground text-sm">Your impact in the recovery community</p>
          </div>
          
          {onNavigateToChat && (
            <Button 
              onClick={onNavigateToChat}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-source font-bold py-2 px-4 rounded-lg tracking-wide transition-colors duration-300"
            >
              CHAT
            </Button>
          )}
        </div>

        {/* Key Metrics Cards - All 4 in one row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* Chats This Week */}
          <Card className="bg-card p-3 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="text-center">
              <div className="bg-primary p-2 rounded-sm mx-auto w-fit mb-2">
                <MessageSquare className="text-primary-foreground" size={16} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                {analytics.chatsThisWeek}
              </h3>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Chats This Week
              </p>
            </div>
          </Card>

          {/* Chats This Month */}
          <Card className="bg-card p-3 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="text-center">
              <div className="bg-green-500 p-2 rounded-sm mx-auto w-fit mb-2">
                <Calendar className="text-white" size={16} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                {analytics.chatsThisMonth}
              </h3>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Chats This Month
              </p>
            </div>
          </Card>

          {/* Chats This Year */}
          <Card className="bg-card p-3 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="text-center">
              <div className="bg-blue-500 p-2 rounded-sm mx-auto w-fit mb-2">
                <TrendingUp className="text-white" size={16} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                {analytics.chatsYearToDate}
              </h3>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Chats This Year
              </p>
            </div>
          </Card>

          {/* Average Chat Duration */}
          <Card className="bg-card p-3 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="text-center">
              <div className="bg-orange-500 p-2 rounded-sm mx-auto w-fit mb-2">
                <Clock className="text-white" size={16} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                {analytics.averageChatDuration}m
              </h3>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Average Chat Duration
              </p>
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-card p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">
            PERFORMANCE METRICS
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-yellow-400 p-3 rounded-sm mx-auto w-fit mb-2">
                <Activity className="text-black" size={20} />
              </div>
              <div className="text-2xl font-bold text-card-foreground">{analytics.responseTime}m</div>
              <p className="text-muted-foreground text-xs uppercase">Response Time</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 p-3 rounded-sm mx-auto w-fit mb-2">
                <Star className="text-white" size={20} />
              </div>
              <div className="text-2xl font-bold text-card-foreground">{analytics.satisfactionScore}</div>
              <p className="text-muted-foreground text-xs uppercase">Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500 p-3 rounded-sm mx-auto w-fit mb-2">
                <Users className="text-white" size={20} />
              </div>
              <div className="text-2xl font-bold text-card-foreground">{analytics.activeSessions}</div>
              <p className="text-muted-foreground text-xs uppercase">Active Now</p>
            </div>
          </div>
        </Card>

        {/* Top Words Used by Users */}
        <Card className="bg-card p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">
            TOP WORDS IN USER MESSAGES
          </h3>
          <div className="space-y-3">
            {analytics.topWords.length > 0 ? (
              analytics.topWords.map((wordData, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-2 rounded-sm w-8 h-8 flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-card-foreground font-source text-sm capitalize">{wordData.word}</span>
                  </div>
                  <span className="text-primary font-source font-bold text-sm">{wordData.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <span className="text-muted-foreground font-source text-sm italic">
                  No chat data available yet
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Weekly Activity Trend */}
        <Card className="bg-black/[7.5%] p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">
            WEEKLY ACTIVITY TREND
          </h3>
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
                <span className="text-xs font-bold text-card-foreground">{day.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Stats */}
        <Card className="bg-card p-4 rounded-lg mb-4 border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground mb-4 tracking-wide">
            ADDITIONAL INSIGHTS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-source text-sm">Total Messages</span>
              <span className="text-primary font-source font-bold text-sm">{analytics.totalMessages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-source text-sm">Success Rate</span>
              <span className="text-primary font-source font-bold text-sm">
                {analytics.chatsYearToDate > 0 ? Math.round((analytics.completedSessions / analytics.chatsYearToDate) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default SpecialistAnalyticsDashboard;