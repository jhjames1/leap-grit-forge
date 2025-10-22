/**
 * Employer/EAP Analytics Dashboard
 * HIPAA-compliant, anonymized metrics view for enterprise employers
 * Enforces minimum cohort size rule (n >= 10)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Users, Heart, Briefcase, 
  MessageSquare, Award, AlertCircle, Download, FileText,
  Activity, Target, Shield
} from 'lucide-react';
import { employerAnalyticsService } from '@/services/employerAnalyticsService';
import { EmployerDashboardData, EmployerAnalyticsQuery } from '@/types/employerAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface EmployerAnalyticsDashboardProps {
  orgId: string;
  orgName: string;
}

export const EmployerAnalyticsDashboard = ({ orgId, orgName }: EmployerAnalyticsDashboardProps) => {
  const [data, setData] = useState<EmployerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'this_quarter' | 'last_quarter' | 'rolling_90'>('this_quarter');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [orgId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const query: EmployerAnalyticsQuery = {
        orgId,
        range: timeRange
      };
      
      const dashboardData = await employerAnalyticsService.getDashboardData(query);
      setData(dashboardData);
      
      if (!dashboardData) {
        toast.error('Insufficient data: cohort size below minimum threshold (n=10)');
      }
    } catch (error) {
      console.error('Failed to load employer analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // TODO: Implement PDF export with quarterly report template
      toast.success('Quarterly report will be available for download');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // TODO: Implement CSV export with compliance checks
      toast.success('Data export will be available for download');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Insufficient Data
          </CardTitle>
          <CardDescription>
            Analytics cannot be displayed due to insufficient cohort size (minimum 10 users required for privacy compliance)
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{orgName} Recovery Analytics</h1>
          <p className="text-muted-foreground mt-1">
            HIPAA-compliant, anonymized insights | Cohort size: {summary.cohortSize} users
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="rolling_90">Rolling 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleExportPDF} disabled={exporting} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Quarterly Report
          </Button>
          
          <Button onClick={handleExportCSV} disabled={exporting} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Compliance Notice */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Privacy & Compliance</p>
              <p className="text-sm text-muted-foreground mt-1">
                All data is anonymized and aggregated. Individual user information is never exposed. 
                Minimum cohort size of 10 users enforced. BAA in effect.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insight Snapshots */}
      {summary.insightSnapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.insightSnapshots.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Weekly Active Users"
              value={`${summary.engagement.weeklyActiveUsers.toFixed(0)}%`}
              icon={<Users className="h-4 w-4" />}
              trend={summary.engagement.weeklyActiveUsers >= 70 ? 'up' : 'stable'}
            />
            <MetricCard
              title="Average Streak"
              value={`${summary.engagement.avgStreakDuration.toFixed(0)} days`}
              icon={<Award className="h-4 w-4" />}
              trend={summary.engagement.avgStreakDuration >= 7 ? 'up' : 'stable'}
            />
            <MetricCard
              title="Journey Completion"
              value={`${summary.engagement.journeyCompletionRate.toFixed(0)}%`}
              icon={<Target className="h-4 w-4" />}
              trend={summary.engagement.journeyCompletionRate >= 50 ? 'up' : 'stable'}
            />
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Active Users</CardTitle>
                <CardDescription>
                  Percentage of enrolled users active each week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {summary.engagement.weeklyActiveUsers.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {summary.cohortSize} users in cohort
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Engagement Mix</CardTitle>
                <CardDescription>
                  Distribution of feature usage across cohort
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <FeatureBar label="Journaling" percentage={summary.engagement.featureEngagementMix.journaling} />
                  <FeatureBar label="Peer Chat" percentage={summary.engagement.featureEngagementMix.peerChat} />
                  <FeatureBar label="Breathing" percentage={summary.engagement.featureEngagementMix.breathingExercises} />
                  <FeatureBar label="Urge Tracker" percentage={summary.engagement.featureEngagementMix.urgeTracker} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Wellbeing Tab */}
        <TabsContent value="wellbeing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Mood Improvement"
              value={`${summary.wellbeing.avgMoodImprovement > 0 ? '+' : ''}${summary.wellbeing.avgMoodImprovement.toFixed(1)}`}
              icon={<Heart className="h-4 w-4" />}
              trend={summary.wellbeing.avgMoodImprovement > 0 ? 'up' : 'stable'}
              description="Average mood score change"
            />
            <MetricCard
              title="Stability Days"
              value={`${summary.wellbeing.stabilityDays.toFixed(0)}`}
              icon={<Activity className="h-4 w-4" />}
              trend="stable"
              description="Average consecutive stable days"
            />
            <MetricCard
              title="Crisis Reductions"
              value={`${summary.wellbeing.crisisAlertReductions}%`}
              icon={<AlertCircle className="h-4 w-4" />}
              trend={summary.wellbeing.crisisAlertReductions > 0 ? 'up' : 'stable'}
              description="Reduction in crisis alerts"
            />
          </div>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="EAP Escalation Avoidance"
              value={`${summary.roi.eapEscalationAvoidance.toFixed(0)}%`}
              icon={<Briefcase className="h-4 w-4" />}
              trend={summary.roi.eapEscalationAvoidance > 60 ? 'up' : 'stable'}
              description="Reduction in EAP escalations"
            />
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">HR Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Retention, absenteeism, and RTW metrics require HR data integration.
                  Contact support to connect your HR system.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Culture Tab */}
        <TabsContent value="culture" className="space-y-4">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Culture Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Culture metrics (confidence, belonging, stigma reduction) require pulse survey implementation.
                These features are coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Supporting components
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

function MetricCard({ title, value, icon, trend, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center gap-2">
          {value}
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function FeatureBar({ label, percentage }: { label: string; percentage: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default EmployerAnalyticsDashboard;
