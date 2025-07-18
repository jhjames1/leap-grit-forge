import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Star, Target } from 'lucide-react';

interface PeerMetrics {
  peer_id: string;
  month: string;
  chat_completion_rate?: number;
  checkin_completion_rate?: number;
  avg_user_rating?: number;
  avg_streak_impact?: number;
  avg_response_time_seconds?: number;
  first_name: string;
  last_name: string;
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

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
    if (!seconds) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 1).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('peer_monthly_metrics')
        .select(`
          peer_id,
          month,
          chat_completion_rate,
          checkin_completion_rate,
          avg_user_rating,
          avg_streak_impact,
          avg_response_time_seconds,
          peer_specialists!inner(first_name, last_name)
        `)
        .gte('month', startDate)
        .lt('month', endDate);

      if (error) throw error;

      const formattedMetrics: PeerMetrics[] = data.map(item => ({
        peer_id: item.peer_id,
        month: item.month,
        chat_completion_rate: item.chat_completion_rate,
        checkin_completion_rate: item.checkin_completion_rate,
        avg_user_rating: item.avg_user_rating,
        avg_streak_impact: item.avg_streak_impact,
        avg_response_time_seconds: item.avg_response_time_seconds,
        first_name: (item.peer_specialists as any).first_name,
        last_name: (item.peer_specialists as any).last_name,
      }));

      setMetrics(formattedMetrics);

      // Calculate consolidated metrics
      if (formattedMetrics.length > 0) {
        const consolidated: ConsolidatedMetrics = {
          chat_completion_rate: formattedMetrics.reduce((sum, m) => sum + (m.chat_completion_rate || 0), 0) / formattedMetrics.length,
          checkin_completion_rate: formattedMetrics.reduce((sum, m) => sum + (m.checkin_completion_rate || 0), 0) / formattedMetrics.length,
          avg_user_rating: formattedMetrics.reduce((sum, m) => sum + (m.avg_user_rating || 0), 0) / formattedMetrics.length,
          avg_streak_impact: formattedMetrics.reduce((sum, m) => sum + (m.avg_streak_impact || 0), 0) / formattedMetrics.length,
          avg_response_time_seconds: formattedMetrics.reduce((sum, m) => sum + (m.avg_response_time_seconds || 0), 0) / formattedMetrics.length,
          total_specialists: formattedMetrics.length,
        };
        setConsolidatedMetrics(consolidated);
      } else {
        setConsolidatedMetrics(null);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const computeMetrics = async () => {
    setIsComputing(true);
    try {
      const { error } = await supabase.functions.invoke('compute-peer-metrics', {
        body: { month: `${selectedMonth}-01` }
      });

      if (error) throw error;

      // Refresh metrics after computation
      await fetchMetrics();
      onRefresh?.();
    } catch (error) {
      console.error('Error computing metrics:', error);
    } finally {
      setIsComputing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedMonth]);

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={computeMetrics}
            disabled={isComputing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isComputing ? 'animate-spin' : ''}`} />
            {isComputing ? 'Computing...' : 'Compute Metrics'}
          </Button>
        </div>
      </div>

      {/* Consolidated Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Performance Metrics
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
                Click "Compute Metrics" to generate performance data for {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
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
                    <p>Average chat session completion rate across all specialists</p>
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
                    <p>Average check-in completion rate across all specialists</p>
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
                    <p>Average user satisfaction rating across all specialists</p>
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
                    <p>Average recovery streak impact across all specialists</p>
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
                    <p>Average first response time across all specialists</p>
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
                <CardTitle className="text-lg">
                  {specialist.first_name} {specialist.last_name}
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
                            <p className="text-xs text-muted-foreground">Chat session completion rate (Target ≥ 75%)</p>
                          </div>
                          <div className={`text-xl font-bold ${getMetricColor(specialist.chat_completion_rate, 75)}`}>
                            {specialist.chat_completion_rate?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of chat sessions successfully completed</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-bold">Check-in Completion</p>
                            <p className="text-xs text-muted-foreground">Scheduled check-in completion rate (Target ≥ 75%)</p>
                          </div>
                          <div className={`text-xl font-bold ${getMetricColor(specialist.checkin_completion_rate, 75)}`}>
                            {specialist.checkin_completion_rate?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of scheduled check-ins completed on time</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-bold">User Rating</p>
                            <p className="text-xs text-muted-foreground">Average user satisfaction rating (Target ≥ 4.5★)</p>
                          </div>
                          <div className={`text-xl font-bold ${getMetricColor(specialist.avg_user_rating, 4.5)} flex items-center gap-1`}>
                            <Star className="h-4 w-4 fill-current" />
                            {specialist.avg_user_rating?.toFixed(1) || '0.0'}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average rating given by users after sessions</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-bold">Streak Impact</p>
                            <p className="text-xs text-muted-foreground">Average recovery streak improvement (Target ≥ +1d)</p>
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
                        <p>Average days added to users' recovery streaks after sessions</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-bold">Response Time</p>
                            <p className="text-xs text-muted-foreground">Average first response time (Target ≤ 45s)</p>
                          </div>
                          <div className={`text-xl font-bold ${getMetricColor(specialist.avg_response_time_seconds, 45, true)} flex items-center gap-1`}>
                            <Clock className="h-4 w-4" />
                            {formatResponseTime(specialist.avg_response_time_seconds) || '0s'}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average time to first response in chat sessions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
};

export default PeerPerformanceDashboard;