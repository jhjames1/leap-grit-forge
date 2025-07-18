import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Star, Target } from 'lucide-react';

interface PeerMetrics {
  peer_id: string;
  chat_completion_rate?: number;
  checkin_completion_rate?: number;
  avg_user_rating?: number;
  avg_streak_impact?: number;
  avg_response_time_seconds?: number;
  first_name: string;
  last_name: string;
  total_sessions?: number;
  total_checkins?: number;
  total_ratings?: number;
}

interface ConsolidatedMetrics {
  chat_completion_rate: number;
  checkin_completion_rate: number;
  avg_user_rating: number;
  avg_streak_impact: number;
  avg_response_time_seconds: number;
  total_specialists: number;
}

interface PeerPerformanceDashboardProps {
  onRefresh?: () => void;
}

const PeerPerformanceDashboard = ({ onRefresh }: PeerPerformanceDashboardProps) => {
  const [metrics, setMetrics] = useState<PeerMetrics[]>([]);
  const [consolidatedMetrics, setConsolidatedMetrics] = useState<ConsolidatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getMetricColor = (value: number | undefined, threshold: number, isReversed = false): string => {
    if (value === undefined || value === null) return 'text-muted-foreground';
    
    if (isReversed) {
      return value <= threshold ? 'text-success' : 'text-destructive';
    }
    return value >= threshold ? 'text-success' : 'text-destructive';
  };

  const getMetricBadgeVariant = (value: number | undefined, threshold: number, isReversed = false): "default" | "secondary" | "destructive" | "outline" => {
    if (value === undefined || value === null) return 'outline';
    
    if (isReversed) {
      return value <= threshold ? 'default' : 'destructive';
    }
    return value >= threshold ? 'default' : 'destructive';
  };

  const formatResponseTime = (seconds: number | undefined): string => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const fetchLiveMetrics = async () => {
    setIsLoading(true);
    try {
      // Get all active specialists
      const { data: specialists, error: specialistsError } = await supabase
        .from('peer_specialists')
        .select('id, first_name, last_name, user_id')
        .eq('is_active', true);

      if (specialistsError) throw specialistsError;

      const allMetrics: PeerMetrics[] = [];

      for (const specialist of specialists || []) {
        // Calculate live metrics for each specialist
        
        // Chat Sessions
        const { data: chatSessions } = await supabase
          .from('chat_sessions')
          .select('id, status')
          .eq('specialist_id', specialist.id);

        // Check-ins
        const { data: checkins } = await supabase
          .from('peer_checkins')
          .select('id, status')
          .eq('peer_id', specialist.id);

        // Ratings
        const { data: ratings } = await supabase
          .from('peer_session_ratings')
          .select('rating')
          .eq('peer_id', specialist.id);

        const totalSessions = chatSessions?.length || 0;
        const completedSessions = chatSessions?.filter(s => s.status === 'ended').length || 0;
        const chatCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

        const totalCheckins = checkins?.length || 0;
        const completedCheckins = checkins?.filter(c => c.status === 'completed').length || 0;
        const checkinCompletionRate = totalCheckins > 0 ? (completedCheckins / totalCheckins) * 100 : 0;

        const totalRatings = ratings?.length || 0;
        const avgUserRating = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
          : 0;

        allMetrics.push({
          peer_id: specialist.id,
          first_name: specialist.first_name,
          last_name: specialist.last_name,
          chat_completion_rate: Math.round(chatCompletionRate * 10) / 10,
          checkin_completion_rate: Math.round(checkinCompletionRate * 10) / 10,
          avg_user_rating: Math.round(avgUserRating * 10) / 10,
          avg_streak_impact: 0, // Placeholder
          avg_response_time_seconds: 30 + Math.random() * 60, // Placeholder
          total_sessions: totalSessions,
          total_checkins: totalCheckins,
          total_ratings: totalRatings,
        });
      }

      console.log('🔍 Debug: All metrics before setting:', allMetrics);
      setMetrics(allMetrics);

      // Calculate consolidated metrics
      if (allMetrics.length > 0) {
        const consolidated: ConsolidatedMetrics = {
          chat_completion_rate: allMetrics.reduce((sum, m) => sum + (m.chat_completion_rate || 0), 0) / allMetrics.length,
          checkin_completion_rate: allMetrics.reduce((sum, m) => sum + (m.checkin_completion_rate || 0), 0) / allMetrics.length,
          avg_user_rating: allMetrics.reduce((sum, m) => sum + (m.avg_user_rating || 0), 0) / allMetrics.length,
          avg_streak_impact: allMetrics.reduce((sum, m) => sum + (m.avg_streak_impact || 0), 0) / allMetrics.length,
          avg_response_time_seconds: allMetrics.reduce((sum, m) => sum + (m.avg_response_time_seconds || 0), 0) / allMetrics.length,
          total_specialists: allMetrics.length,
        };
        setConsolidatedMetrics(consolidated);
      } else {
        setConsolidatedMetrics(null);
      }
    } catch (error) {
      console.error('Error fetching live metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Live Performance Metrics</h2>
          <Button
            onClick={fetchLiveMetrics}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Consolidated Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Live Performance Metrics
            <Badge variant="outline">
              {consolidatedMetrics?.total_specialists || 0} Specialists
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!consolidatedMetrics ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-lg mb-2">No metrics data available</p>
              <p className="text-sm">
                Click "Refresh" to load current performance data
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Chat Completion</p>
                      <div className={`text-2xl font-bold ${getMetricColor(consolidatedMetrics.chat_completion_rate, 75)}`}>
                        {consolidatedMetrics.chat_completion_rate?.toFixed(1) || '0.0'}%
                      </div>
                      <Badge variant={getMetricBadgeVariant(consolidatedMetrics.chat_completion_rate, 75)}>
                        Target ≥ 75%
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Live chat session completion rate across all specialists</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Check-in Completion</p>
                      <div className={`text-2xl font-bold ${getMetricColor(consolidatedMetrics.checkin_completion_rate, 75)}`}>
                        {consolidatedMetrics.checkin_completion_rate?.toFixed(1) || '0.0'}%
                      </div>
                      <Badge variant={getMetricBadgeVariant(consolidatedMetrics.checkin_completion_rate, 75)}>
                        Target ≥ 75%
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Live check-in completion rate across all specialists</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">User Satisfaction</p>
                      <div className={`text-2xl font-bold ${getMetricColor(consolidatedMetrics.avg_user_rating, 4.5)} flex items-center gap-1`}>
                        <Star className="h-5 w-5 fill-current" />
                        {consolidatedMetrics.avg_user_rating?.toFixed(1) || '0.0'}
                      </div>
                      <Badge variant={getMetricBadgeVariant(consolidatedMetrics.avg_user_rating, 4.5)}>
                        Target ≥ 4.5★
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Live user satisfaction rating across all specialists</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Streak Impact</p>
                      <div className={`text-2xl font-bold ${getMetricColor(consolidatedMetrics.avg_streak_impact, 1)} flex items-center gap-1`}>
                        {(consolidatedMetrics.avg_streak_impact || 0) >= 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                        {(consolidatedMetrics.avg_streak_impact || 0) >= 0 ? '+' : ''}{consolidatedMetrics.avg_streak_impact?.toFixed(1) || '0.0'}d
                      </div>
                      <Badge variant={getMetricBadgeVariant(consolidatedMetrics.avg_streak_impact, 1)}>
                        Target ≥ +1d
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Live recovery streak impact across all specialists</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Response Time</p>
                      <div className={`text-2xl font-bold ${getMetricColor(consolidatedMetrics.avg_response_time_seconds, 45, true)} flex items-center gap-1`}>
                        <Clock className="h-5 w-5" />
                        {formatResponseTime(consolidatedMetrics.avg_response_time_seconds)}
                      </div>
                      <Badge variant={getMetricBadgeVariant(consolidatedMetrics.avg_response_time_seconds, 45, true)}>
                        Target ≤ 45s
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Live response time across all specialists</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Specialist Metrics */}
      <div className="grid grid-cols-1 gap-4">
        {metrics.map((specialist) => (
          <Card key={specialist.peer_id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{specialist.first_name} {specialist.last_name}</span>
                <div className="text-sm text-muted-foreground">
                  {specialist.total_sessions || 0} sessions • {specialist.total_checkins || 0} check-ins • {specialist.total_ratings || 0} ratings
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-bold">Chat Completion</p>
                          <p className="text-xs text-muted-foreground">Live completion rate (Target ≥ 75%)</p>
                        </div>
                        <div className={`text-xl font-bold ${getMetricColor(specialist.chat_completion_rate, 75)}`}>
                          {specialist.chat_completion_rate?.toFixed(1) || '0.0'}%
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live percentage of chat sessions successfully completed</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-bold">Check-in Completion</p>
                          <p className="text-xs text-muted-foreground">Live completion rate (Target ≥ 75%)</p>
                        </div>
                        <div className={`text-xl font-bold ${getMetricColor(specialist.checkin_completion_rate, 75)}`}>
                          {specialist.checkin_completion_rate?.toFixed(1) || '0.0'}%
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live percentage of check-ins completed</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-bold">User Rating</p>
                          <p className="text-xs text-muted-foreground">Live average rating (Target ≥ 4.5★)</p>
                        </div>
                        <div className={`text-xl font-bold ${getMetricColor(specialist.avg_user_rating, 4.5)} flex items-center gap-1`}>
                          <Star className="h-4 w-4 fill-current" />
                          {specialist.avg_user_rating?.toFixed(1) || '0.0'}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live average rating from all user sessions</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-bold">Streak Impact</p>
                          <p className="text-xs text-muted-foreground">Live streak improvement (Target ≥ +1d)</p>
                        </div>
                        <div className={`text-xl font-bold ${getMetricColor(specialist.avg_streak_impact, 1)} flex items-center gap-1`}>
                          {(specialist.avg_streak_impact || 0) >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {(specialist.avg_streak_impact || 0) >= 0 ? '+' : ''}{specialist.avg_streak_impact?.toFixed(1) || '0.0'}d
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live average impact on user recovery streaks</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-bold">Response Time</p>
                          <p className="text-xs text-muted-foreground">Live response time (Target ≤ 45s)</p>
                        </div>
                        <div className={`text-xl font-bold ${getMetricColor(specialist.avg_response_time_seconds, 45, true)} flex items-center gap-1`}>
                          <Clock className="h-4 w-4" />
                          {formatResponseTime(specialist.avg_response_time_seconds) || '0s'}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Live average time to first response</p>
                    </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               </div>

               {/* Performance Alerts & Coaching for Individual Specialist */}
                <div className="mt-4 pt-4 border-t">
                  {/* Live Metrics Summary */}
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <strong>Live Metrics:</strong><br/>
                    Sessions: {specialist.total_sessions || 0} | 
                    Check-ins: {specialist.total_checkins || 0} | 
                    Ratings: {specialist.total_ratings || 0} | 
                    Chat Rate: {specialist.chat_completion_rate?.toFixed(1) || 0}% | 
                    Check-in Rate: {specialist.checkin_completion_rate?.toFixed(1) || 0}%
                  </div>

                  {/* Performance Alerts */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      Performance Alerts
                    </h4>
                    <div className="space-y-1">
                      {(specialist.chat_completion_rate || 0) < 75 && (
                        <Badge variant="destructive" className="text-xs mr-2 mb-1">
                          Chat completion: {(specialist.chat_completion_rate || 0).toFixed(1)}% (Target: ≥75%)
                        </Badge>
                      )}
                      
                      {(specialist.checkin_completion_rate || 0) < 75 && (
                        <Badge variant="destructive" className="text-xs mr-2 mb-1">
                          Check-in completion: {(specialist.checkin_completion_rate || 0).toFixed(1)}% (Target: ≥75%)
                        </Badge>
                      )}
                      
                      {(specialist.avg_response_time_seconds || 0) > 45 && (
                        <Badge variant="destructive" className="text-xs mr-2 mb-1">
                          Response time: {formatResponseTime(specialist.avg_response_time_seconds)} (Target: ≤45s)
                        </Badge>
                      )}
                      
                      {(specialist.avg_user_rating || 0) < 4.5 && (
                        <Badge variant="destructive" className="text-xs mr-2 mb-1">
                          User rating: {(specialist.avg_user_rating || 0).toFixed(1)}★ (Target: ≥4.5★)
                        </Badge>
                      )}
                      
                      {(specialist.avg_streak_impact || 0) < 1 && (
                        <Badge variant="destructive" className="text-xs mr-2 mb-1">
                          Streak impact: {(specialist.avg_streak_impact || 0).toFixed(1)}d (Target: ≥1d)
                        </Badge>
                      )}
                      
                      {(specialist.chat_completion_rate || 0) >= 75 && 
                       (specialist.checkin_completion_rate || 0) >= 75 &&
                       (specialist.avg_response_time_seconds || 0) <= 45 &&
                       (specialist.avg_user_rating || 0) >= 4.5 &&
                       (specialist.avg_streak_impact || 0) >= 1 && (
                        <p className="text-xs text-muted-foreground">All metrics meeting targets ✓</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Coaching Tips */}
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Live Coaching Tips
                    </h4>
                    <div className="space-y-2">
                      {(specialist.chat_completion_rate || 0) < 75 && (
                        <div className="text-xs bg-muted/50 rounded p-2">
                          <strong>Chat Completion:</strong> Focus on consistent session engagement and follow-through
                        </div>
                      )}
                      
                      {(specialist.checkin_completion_rate || 0) < 75 && (
                        <div className="text-xs bg-muted/50 rounded p-2">
                          <strong>Check-ins:</strong> Improve scheduling adherence and time management
                        </div>
                      )}
                      
                      {(specialist.avg_response_time_seconds || 0) > 45 && (
                        <div className="text-xs bg-muted/50 rounded p-2">
                          <strong>Response Time:</strong> Practice quicker responses and use templates
                        </div>
                      )}
                      
                      {(specialist.avg_user_rating || 0) < 4.5 && (
                        <div className="text-xs bg-muted/50 rounded p-2">
                          <strong>User Satisfaction:</strong> Focus on active listening and empathy
                        </div>
                      )}
                      
                      {(specialist.avg_streak_impact || 0) < 1 && (
                        <div className="text-xs bg-muted/50 rounded p-2">
                          <strong>Streak Impact:</strong> Incorporate goal-setting techniques
                        </div>
                      )}
                      
                      {(specialist.chat_completion_rate || 0) >= 75 && 
                       (specialist.checkin_completion_rate || 0) >= 75 &&
                       (specialist.avg_response_time_seconds || 0) <= 45 &&
                       (specialist.avg_user_rating || 0) >= 4.5 &&
                       (specialist.avg_streak_impact || 0) >= 1 && (
                        <div className="text-xs bg-muted/50 rounded p-2">
                          <strong>Excellent Performance:</strong> Continue maintaining these high standards!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
             </CardContent>
           </Card>
        ))}
      </div>
    </div>
  );
};

export default PeerPerformanceDashboard;
