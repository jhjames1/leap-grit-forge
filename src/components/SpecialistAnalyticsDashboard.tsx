import { useState } from 'react';
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
  Trophy,
  ChevronLeft
} from 'lucide-react';
import { useSpecialistAnalytics } from '@/hooks/useSpecialistAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface SpecialistAnalyticsDashboardProps {
  onBack?: () => void;
}

const SpecialistAnalyticsDashboard = ({ onBack }: SpecialistAnalyticsDashboardProps) => {
  const { analytics, loading, error } = useSpecialistAnalytics();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4 p-2">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Specialist Dashboard</h1>
          </div>
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
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={onBack} className="mr-4 p-2">
              <ChevronLeft size={20} />
            </Button>
          </div>
          
          <div className="flex justify-between items-start mb-6">
            {/* Left column: Title and welcome text */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">SPECIALIST</span>
                <span className="font-fjalla font-extrabold italic">DASHBOARD</span>
              </h1>
              <div className="mt-8"></div>
              <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
                WELCOME, <span className="font-bold italic">{userName.toUpperCase()}</span>
              </p>
              <p className="text-muted-foreground text-sm">Your impact in the recovery community</p>
            </div>
            
            {/* Right column: Achievement badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-end space-x-2 mt-12">
                <div className="bg-primary p-3 rounded-lg">
                  <Trophy className="text-primary-foreground" size={20} />
                </div>
                <span className="text-3xl font-bold text-foreground">{analytics.completedSessions}</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1">Sessions Completed</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards - Top Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Chats This Week */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-primary p-3 rounded-sm">
                <MessageSquare className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                  {analytics.chatsThisWeek}
                </h3>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  This Week
                </p>
              </div>
            </div>
          </Card>

          {/* Average Duration */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-primary p-3 rounded-sm">
                <Clock className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                  {analytics.averageChatDuration}m
                </h3>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Avg Duration
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Chats This Month */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-3 rounded-sm">
                <Calendar className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                  {analytics.chatsThisMonth}
                </h3>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  This Month
                </p>
              </div>
            </div>
          </Card>

          {/* Year to Date */}
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-sm">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-fjalla font-bold text-card-foreground text-lg">
                  {analytics.chatsYearToDate}
                </h3>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Year to Date
                </p>
              </div>
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

        {/* Call to Action */}
        <Card className="relative bg-card rounded-lg mb-4 border-0 shadow-none transition-colors duration-300 overflow-hidden">
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10" />
          
          {/* Content */}
          <div className="relative z-10 p-4">
            <div className="flex flex-col items-center text-center mb-4">
              <div>
                <h3 className="font-fjalla font-bold text-card-foreground text-2xl tracking-wide">
                  READY TO HELP?
                </h3>
                <p className="text-muted-foreground text-sm font-source">
                  Jump back into the chat dashboard
                </p>
              </div>
            </div>
            <Button 
              onClick={onBack}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-source font-bold py-3 rounded-lg tracking-wide transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              BACK TO CHAT DASHBOARD
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SpecialistAnalyticsDashboard;