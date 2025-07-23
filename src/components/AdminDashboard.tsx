
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import SecurityAuditPanel from './SecurityAuditPanel';
import { adminAnalytics, type UserAnalytics } from '@/services/adminAnalyticsService';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  MessageSquare,
  Target,
  Activity,
  Shield,
  UserCheck,
  LogOut,
  Bot
} from 'lucide-react';
import PeerSpecialistManagement from './PeerSpecialistManagement';
import MotivationalContentManagement from './MotivationalContentManagement';
import ForemanContentManagement from './ForemanContentManagement';
import AdminManagement from './AdminManagement';
import UserManagement from './UserManagement';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { t } = useLanguage();
  const { signOut, user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get admin user's first name for welcome message
  const adminFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await adminAnalytics.calculateUserAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadAnalytics();
    // Also refresh specialist presence data if on specialists tab
    if (window.location.hash.includes('specialists')) {
      // This will be handled by the specialist component's refresh
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Format engagement trends for display
  const engagementTrends = analytics ? [
    { domain: t('admin.domains.peerSupport'), avg: analytics.domainEngagement.peerSupport, trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%' },
    { domain: t('admin.domains.selfCare'), avg: analytics.domainEngagement.selfCare, trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%' },
    { domain: t('admin.domains.structure'), avg: analytics.domainEngagement.structure, trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%' },
    { domain: t('admin.domains.mood'), avg: analytics.domainEngagement.mood, trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%' },
    { domain: t('admin.domains.cravingControl'), avg: analytics.domainEngagement.cravingControl, trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%' }
  ] : [];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {adminFirstName}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoading}
            >
              <Activity className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <Button 
              onClick={onBack}
              variant="outline"
              size="sm"
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome, {adminFirstName}!</h2>
                <p className="text-primary-foreground/80">Monitor and manage your LEAP community</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-primary-foreground/80">System Status</div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-transparent border-0 gap-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">Overview</TabsTrigger>
            <TabsTrigger value="specialists" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <UserCheck className="mr-2 h-4 w-4" />
              Specialists
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <MessageSquare className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="foreman-content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <Bot className="mr-2 h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <Users className="mr-2 h-4 w-4" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Time Filter */}
            <div className="flex space-x-2 mb-6">
              {['week', 'month', 'quarter'].map((period) => (
                <Button
                  key={period}
                  onClick={() => setSelectedTimeframe(period)}
                  variant={selectedTimeframe === period ? 'default' : 'outline'}
                  size="sm"
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>

            {/* Key Metrics - First Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-3 rounded-full">
                      <Users className="text-primary-foreground w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-3 rounded-full">
                      <Activity className="text-primary-foreground w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-3 rounded-full">
                      <TrendingUp className="text-primary-foreground w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{analytics?.averageRecoveryStrength || 0}%</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Strength</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-destructive/20 p-3 rounded-full">
                      <AlertTriangle className="text-destructive w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{analytics?.atRiskUsers || 0}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">At Risk</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health Cards - Second Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent p-3 rounded-full">
                      <UserCheck className="text-accent-foreground w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Specialists</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent p-3 rounded-full">
                      <MessageSquare className="text-accent-foreground w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Chats</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent p-3 rounded-full">
                      <Shield className="text-accent-foreground w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">100%</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">System Health</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Domain Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Domain Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {engagementTrends.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">{domain.domain}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-muted-foreground text-sm">{domain.avg}%</span>
                          <Badge variant={domain.trend.startsWith('+') ? 'default' : 'destructive'}>
                            {domain.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {analytics && analytics.totalEngagementActions === 0 && (
                      <p className="text-muted-foreground text-center py-4 text-sm">No engagement data available yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    User Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.userRiskData.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 ${getRiskColor(user.risk)} rounded-full`}></div>
                          <div>
                            <span className="text-sm font-medium">{user.userId}</span>
                            <p className="text-xs text-muted-foreground">{user.lastActivity}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-lg font-bold">{user.recoveryStrength}%</div>
                            <div className="text-xs text-muted-foreground">Strength</div>
                          </div>
                          <Badge className={getRiskBadge(user.risk)}>
                            {user.risk.charAt(0).toUpperCase() + user.risk.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {analytics && analytics.userRiskData.length === 0 && (
                      <p className="text-muted-foreground text-center py-4 text-sm">No user data available yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="specialists">
            <PeerSpecialistManagement />
          </TabsContent>

          <TabsContent value="content">
            <MotivationalContentManagement />
          </TabsContent>

          <TabsContent value="foreman-content">
            <ForemanContentManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="admins">
            <AdminManagement />
          </TabsContent>

          <TabsContent value="security">
            <SecurityAuditPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
