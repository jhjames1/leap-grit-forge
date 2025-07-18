import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, TrendingDown, Star } from 'lucide-react';

interface FlaggedSpecialist {
  peer_id: string;
  first_name: string;
  last_name: string;
  issues: string[];
  chat_completion_rate?: number;
  checkin_completion_rate?: number;
  avg_user_rating?: number;
  avg_response_time_seconds?: number;
}

interface PeerPerformanceAlertsProps {
  selectedMonth: string;
}

const PeerPerformanceAlerts = ({ selectedMonth }: PeerPerformanceAlertsProps) => {
  const [flaggedSpecialists, setFlaggedSpecialists] = useState<FlaggedSpecialist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFlaggedSpecialists();
  }, [selectedMonth]);

  const fetchFlaggedSpecialists = async () => {
    setIsLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 1).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('peer_monthly_metrics')
        .select(`
          peer_id,
          chat_completion_rate,
          checkin_completion_rate,
          avg_user_rating,
          avg_response_time_seconds,
          peer_specialists!inner(first_name, last_name)
        `)
        .gte('month', startDate)
        .lt('month', endDate);

      if (error) throw error;

      const flagged: FlaggedSpecialist[] = [];

      data.forEach(item => {
        const issues: string[] = [];
        
        // Check for performance issues based on targets
        if ((item.chat_completion_rate || 0) < 50) {
          issues.push('Chat completion rate critically low');
        }
        if ((item.checkin_completion_rate || 0) < 50) {
          issues.push('Check-in completion rate critically low');
        }
        if ((item.avg_response_time_seconds || 0) > 60) {
          issues.push('Response time exceeds 60 seconds');
        }
        if ((item.avg_user_rating || 0) < 3.5) {
          issues.push('User satisfaction below 3.5 stars');
        }

        if (issues.length > 0) {
          flagged.push({
            peer_id: item.peer_id,
            first_name: (item.peer_specialists as any).first_name,
            last_name: (item.peer_specialists as any).last_name,
            issues,
            chat_completion_rate: item.chat_completion_rate,
            checkin_completion_rate: item.checkin_completion_rate,
            avg_user_rating: item.avg_user_rating,
            avg_response_time_seconds: item.avg_response_time_seconds,
          });
        }
      });

      setFlaggedSpecialists(flagged);
    } catch (error) {
      console.error('Error fetching flagged specialists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIssueIcon = (issue: string) => {
    if (issue.includes('Response time')) return <Clock className="h-4 w-4" />;
    if (issue.includes('satisfaction')) return <Star className="h-4 w-4" />;
    if (issue.includes('completion')) return <TrendingDown className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatResponseTime = (seconds: number | undefined): string => {
    if (!seconds) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Performance Alerts & Coaching
          <Badge variant={flaggedSpecialists.length > 0 ? "destructive" : "outline"}>
            {flaggedSpecialists.length} flagged
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {flaggedSpecialists.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No specialists flagged for coaching this month</p>
            <p className="text-sm mt-1">All specialists are meeting performance targets</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedSpecialists.map((specialist) => (
              <Alert key={specialist.peer_id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {specialist.first_name} {specialist.last_name}
                      </p>
                      <Button size="sm" variant="outline">
                        Schedule Coaching
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      {specialist.issues.map((issue, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {getIssueIcon(issue)}
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-destructive/20">
                      <div className="text-xs">
                        <p className="text-muted-foreground">Chat Rate</p>
                        <p className="font-medium">{specialist.chat_completion_rate?.toFixed(1) || '0'}%</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Check-ins</p>
                        <p className="font-medium">{specialist.checkin_completion_rate?.toFixed(1) || '0'}%</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Rating</p>
                        <p className="font-medium flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {specialist.avg_user_rating?.toFixed(1) || '0'}
                        </p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Response</p>
                        <p className="font-medium">{formatResponseTime(specialist.avg_response_time_seconds)}</p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PeerPerformanceAlerts;