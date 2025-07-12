
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import SecurityAuditPanel from './SecurityAuditPanel';
import { adminAnalytics, type UserAnalytics } from '@/utils/adminAnalytics';
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
  LogOut
} from 'lucide-react';
import PeerSpecialistManagement from './PeerSpecialistManagement';
import MotivationalContentManagement from './MotivationalContentManagement';

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

  const loadAnalytics = () => {
    setIsLoading(true);
    try {
      const data = adminAnalytics.calculateUserAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadAnalytics();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Format engagement trends for display
  const engagementTrends = analytics ? [
    { domain: t('admin.domains.peerSupport'), avg: analytics.domainEngagement.peerSupport, trend: analytics.engagementTrends.peerSupport >= 50 ? '+' + (analytics.engagementTrends.peerSupport - 50) + '%' : '-' + (50 - analytics.engagementTrends.peerSupport) + '%' },
    { domain: t('admin.domains.selfCare'), avg: analytics.domainEngagement.selfCare, trend: analytics.engagementTrends.selfCare >= 40 ? '+' + (analytics.engagementTrends.selfCare - 40) + '%' : '-' + (40 - analytics.engagementTrends.selfCare) + '%' },
    { domain: t('admin.domains.structure'), avg: analytics.domainEngagement.structure, trend: analytics.engagementTrends.structure >= 30 ? '+' + (analytics.engagementTrends.structure - 30) + '%' : '-' + (30 - analytics.engagementTrends.structure) + '%' },
    { domain: t('admin.domains.mood'), avg: analytics.domainEngagement.mood, trend: analytics.engagementTrends.mood >= 35 ? '+' + (analytics.engagementTrends.mood - 35) + '%' : '-' + (35 - analytics.engagementTrends.mood) + '%' },
    { domain: t('admin.domains.cravingControl'), avg: analytics.domainEngagement.cravingControl, trend: analytics.engagementTrends.cravingControl >= 25 ? '+' + (analytics.engagementTrends.cravingControl - 25) + '%' : '-' + (25 - analytics.engagementTrends.cravingControl) + '%' }
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
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header - Matching home page style */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-6">
            {/* Left column: Title and welcome text */}
            <div className="flex-1">
              <h1 className="text-5xl text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">ADMIN</span><span className="font-fjalla font-extrabold italic">PORTAL</span>
              </h1>
              <div className="mt-8"></div>
              <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
                WELCOME, <span className="font-bold italic">{adminFirstName.toUpperCase()}</span>
              </p>
              <p className="text-muted-foreground text-sm">Monitor and manage your LEAP community</p>
            </div>
            
            {/* Right column: Action buttons */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={refreshData}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <Button 
                  onClick={onBack}
                  variant="outline"
                  size="sm"
                  className="border-muted-foreground text-muted-foreground hover:bg-muted/10"
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-50">Overview</TabsTrigger>
            <TabsTrigger value="specialists" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-50">
              <UserCheck className="mr-2 h-4 w-4" />
              Peer Specialists
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-50">
              <MessageSquare className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-50">
              <Shield className="mr-2 h-4 w-4" />
              System Security
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
                className={selectedTimeframe === period ? 
                  'bg-primary text-primary-foreground' : 
                  'border-border text-muted-foreground hover:bg-muted/10'
                }
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-3 rounded-sm">
                  <Users className="text-primary-foreground" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-card-foreground">{analytics?.totalUsers || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Total Users</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-3 rounded-sm">
                  <Activity className="text-primary-foreground" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-card-foreground">{analytics?.activeUsers || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Active Users</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-3 rounded-sm">
                  <TrendingUp className="text-primary-foreground" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-card-foreground">{analytics?.averageRecoveryStrength || 0}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Avg Strength</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-destructive/20 p-3 rounded-sm">
                  <AlertTriangle className="text-destructive" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-card-foreground">{analytics?.atRiskUsers || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">At Risk</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Domain Engagement Trends */}
          <Card className="bg-black/[7.5%] p-6 rounded-lg mb-6 border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-3 rounded-sm">
                <BarChart3 className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground tracking-wide">DOMAIN ENGAGEMENT</h3>
            </div>
            
            <div className="space-y-3">
              {engagementTrends.map((domain, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-card-foreground font-medium font-source">{domain.domain}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground font-source">{domain.avg}%</span>
                    <Badge className={`${domain.trend.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {domain.trend}
                    </Badge>
                  </div>
                </div>
              ))}
              {analytics && analytics.totalEngagementActions === 0 && (
                <p className="text-muted-foreground text-center py-4 font-source italic">No user engagement data available yet.</p>
              )}
            </div>
          </Card>

          {/* User Risk Heatmap */}
          <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-3 rounded-sm">
                <Target className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground tracking-wide">USER RISK ASSESSMENT</h3>
            </div>
            
            <div className="space-y-3">
              {analytics?.userRiskData.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-black/[7.5%] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${getRiskColor(user.risk)} rounded-full`}></div>
                    <div>
                      <span className="text-card-foreground font-medium font-source">{user.id}</span>
                      <p className="text-muted-foreground text-sm font-source">{user.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-card-foreground">{user.recoveryStrength}%</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Strength</div>
                    </div>
                    <Badge className={getRiskBadge(user.risk)}>
                      {user.risk.charAt(0).toUpperCase() + user.risk.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
              {analytics && analytics.userRiskData.length === 0 && (
                <p className="text-muted-foreground text-center py-4 font-source italic">No user data available yet.</p>
              )}
            </div>
          </Card>
          </TabsContent>

          <TabsContent value="specialists">
            <PeerSpecialistManagement />
          </TabsContent>

          <TabsContent value="content">
            <MotivationalContentManagement />
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
