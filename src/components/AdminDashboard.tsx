import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeAdminAnalytics } from '@/hooks/useRealtimeAdminAnalytics';
import { useRealtimeDomainEngagement } from '@/hooks/useRealtimeDomainEngagement';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SecurityAuditPanel from './SecurityAuditPanel';
import { SpecialistOverviewCards } from './SpecialistOverviewCards';
import { SpecialistPerformanceTable } from './SpecialistPerformanceTable';
import { SpecialistToolbar } from './SpecialistToolbar';
import { Users, TrendingUp, AlertTriangle, BarChart3, Calendar, MessageSquare, Target, Activity, Shield, UserCheck, LogOut, Bot, UserPlus } from 'lucide-react';
import PeerSpecialistManagement from './PeerSpecialistManagement';
import MotivationalContentManagement from './MotivationalContentManagement';
import ForemanContentManagement from './ForemanContentManagement';
import AdminManagement from './AdminManagement';
import UserManagement from './UserManagement';
import EmployerAnalyticsDashboard from './EmployerAnalyticsDashboard';
import { exportSpecialistData } from '@/utils/exportUtils';
interface AdminDashboardProps {
  onBack: () => void;
}
const AdminDashboard = ({
  onBack
}: AdminDashboardProps) => {
  const {
    t
  } = useLanguage();
  const {
    signOut,
    user
  } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [liveSpecialistCount, setLiveSpecialistCount] = useState(0);
  const [liveChatCount, setLiveChatCount] = useState(0);
  const [onlineSpecialists, setOnlineSpecialists] = useState<any[]>([]);
  const [specialistStatuses, setSpecialistStatuses] = useState<Record<string, string>>({});
  
  // Specialist management state
  const [specialistSearchTerm, setSpecialistSearchTerm] = useState('');
  const [specialistFilterStatus, setSpecialistFilterStatus] = useState('all');

  // Use the real-time analytics hook
  const {
    analytics,
    isLoading,
    error,
    refreshAnalytics
  } = useRealtimeAdminAnalytics();

  // Use real-time domain engagement
  const {
    domainData,
    userRiskData,
    isLoading: domainLoading
  } = useRealtimeDomainEngagement();

  // Get admin user's first name for welcome message
  const adminFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Admin';

  // Action handlers for specialist management
  const handleEditSpecialist = () => {
    // TODO: Implement edit specialist functionality
    console.log('Edit specialist functionality');
  };
  const handleResetPassword = () => {
    // TODO: Implement reset password functionality
    console.log('Reset password functionality');
  };
  const handleDeactivateSpecialist = () => {
    // TODO: Implement deactivate specialist functionality
    console.log('Deactivate specialist functionality');
  };

  // Load live counts and specialist statuses
  useEffect(() => {
    const loadLiveCounts = async () => {
      try {
        // Get active specialist count and details with status
        const {
          data: specialists,
          error: specialistError
        } = await supabase
          .from('peer_specialists')
          .select(`
            id,
            first_name,
            last_name,
            avatar_url,
            specialist_status!inner (
              status,
              status_message,
              last_seen
            )
          `)
          .eq('is_active', true)
          .eq('is_verified', true);
          
        if (!specialistError && specialists) {
          setLiveSpecialistCount(specialists.length);
          
          // Filter online specialists and create status map
          const online = specialists.filter(s => s.specialist_status?.status === 'online');
          setOnlineSpecialists(online);
          
          const statusMap: Record<string, string> = {};
          specialists.forEach(s => {
            statusMap[s.id] = s.specialist_status?.status || 'offline';
          });
          setSpecialistStatuses(statusMap);
        }

        // Get active chat count
        const {
          data: chats,
          error: chatError
        } = await supabase.from('chat_sessions').select('id').eq('status', 'active');
        if (!chatError && chats) {
          setLiveChatCount(chats.length);
        }
      } catch (err) {
        console.error('Error loading live counts:', err);
      }
    };
    loadLiveCounts();

    // Set up real-time updates for specialist status
    const channel = supabase
      .channel('admin-specialist-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'specialist_status'
      }, () => loadLiveCounts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'peer_specialists'
      }, () => loadLiveCounts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, () => loadLiveCounts())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const refreshData = () => {
    refreshAnalytics();
  };
  const handleSignOut = async () => {
    await signOut();
  };

  // Specialist management handlers
  const handleSpecialistSearch = (value: string) => {
    setSpecialistSearchTerm(value);
  };

  const handleSpecialistFilter = (value: string) => {
    setSpecialistFilterStatus(value);
  };

  const handleExportSpecialistData = () => {
    if (analytics?.specialistAnalytics?.specialistPerformance) {
      exportSpecialistData(analytics.specialistAnalytics.specialistPerformance);
    }
  };

  const handleInviteSpecialist = () => {
    // This functionality is already implemented in PeerSpecialistManagement
    // We can trigger it or navigate to that section
    console.log('Invite specialist functionality');
  };

  // Filter specialists based on search and filter criteria
  const filteredSpecialists = analytics?.specialistAnalytics?.specialistPerformance?.filter(specialist => {
    const matchesSearch = specialist.name.toLowerCase().includes(specialistSearchTerm.toLowerCase()) ||
                         specialist.email.toLowerCase().includes(specialistSearchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (specialistFilterStatus) {
        case 'active': return specialist.isActive;
        case 'inactive': return !specialist.isActive;
        case 'verified': return specialist.isVerified;
        case 'unverified': return !specialist.isVerified;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Format engagement trends for display
  const engagementTrends = analytics ? [{
    domain: t('admin.domains.peerSupport'),
    avg: analytics.domainEngagement.peerSupport,
    trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%'
  }, {
    domain: t('admin.domains.selfCare'),
    avg: analytics.domainEngagement.selfCare,
    trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%'
  }, {
    domain: t('admin.domains.structure'),
    avg: analytics.domainEngagement.structure,
    trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%'
  }, {
    domain: t('admin.domains.mood'),
    avg: analytics.domainEngagement.mood,
    trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%'
  }, {
    domain: t('admin.domains.cravingControl'),
    avg: analytics.domainEngagement.cravingControl,
    trend: analytics.engagementTrends.trend === 'up' ? '+' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : analytics.engagementTrends.trend === 'down' ? '-' + Math.abs(analytics.engagementTrends.thisWeek - analytics.engagementTrends.lastWeek) + '%' : '0%'
  }] : [];
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-destructive';
      case 'medium':
        return 'bg-warning';
      default:
        return 'bg-chat-active';
    }
  };
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium':
        return 'bg-warning/20 text-warning-foreground border-warning/30';
      default:
        return 'bg-chat-active/20 text-chat-active-foreground border-chat-active/30';
    }
  };
  return <div className="min-h-screen w-full bg-background flex flex-col">
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
            <Button onClick={refreshData} variant="outline" size="sm" className="gap-2" disabled={isLoading}>
              <Activity className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <Button onClick={onBack} variant="outline" size="sm">
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
                <div className="text-sm text-primary-foreground/80">Live Updates</div>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                  <div className="w-2 h-2 bg-chat-active rounded-full mr-2 animate-pulse"></div>
                  Active
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
              {analytics?.specialistAnalytics?.alertFlags && analytics.specialistAnalytics.alertFlags.length > 0 && <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {analytics.specialistAnalytics.alertFlags.length}
                </Badge>}
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
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-6 py-2 border data-[state=active]:border-primary">
              <BarChart3 className="mr-2 h-4 w-4" />
              EAP Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">System Overview</h2>
                  <p className="text-muted-foreground">Real-time monitoring of your LEAP community</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Time Filter */}
                  {['week', 'month', 'quarter'].map(period => 
                    <Button 
                      key={period} 
                      onClick={() => setSelectedTimeframe(period)} 
                      variant={selectedTimeframe === period ? 'default' : 'outline'} 
                      size="sm"
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  )}
                </div>
              </div>

              {/* Key User Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Key User Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>

              {/* System Health Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">System Health Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-accent p-3 rounded-full">
                          <UserCheck className="text-accent-foreground w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">{onlineSpecialists.length}</div>
                            <div className="text-sm text-muted-foreground">/ {liveSpecialistCount}</div>
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Online Specialists</div>
                        </div>
                      </div>
                      {onlineSpecialists.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {onlineSpecialists.slice(0, 3).map((specialist) => (
                            <div key={specialist.id} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-chat-active rounded-full"></div>
                              <span className="text-muted-foreground">
                                {specialist.first_name} {specialist.last_name}
                              </span>
                            </div>
                          ))}
                          {onlineSpecialists.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{onlineSpecialists.length - 3} more online
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-accent p-3 rounded-full">
                          <MessageSquare className="text-accent-foreground w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{liveChatCount}</div>
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
              </div>

              {/* Real-time Analytics */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Real-time Analytics</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Real-time Domain Engagement */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Domain Engagement
                        <Badge variant="secondary" className="bg-chat-active/20 text-chat-active-foreground border-chat-active/30">
                          <div className="w-2 h-2 bg-chat-active rounded-full mr-1 animate-pulse"></div>
                          LIVE
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {domainData ? [
                          { name: 'Peer Support', value: domainData.peerSupport, icon: '👥' },
                          { name: 'Self Care', value: domainData.selfCare, icon: '🧘' },
                          { name: 'Structure', value: domainData.structure, icon: '📅' },
                          { name: 'Mood', value: domainData.mood, icon: '😊' },
                          { name: 'Craving Control', value: domainData.cravingControl, icon: '🎯' }
                        ].map((domain, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-lg">{domain.icon}</div>
                              <span className="text-sm font-medium">{domain.name}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold">{domain.value}</span>
                              <Badge variant="outline">
                                actions
                              </Badge>
                            </div>
                          </div>
                        )) : domainLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground text-sm mt-2">Loading real-time data...</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4 text-sm">No engagement data available yet.</p>
                        )}
                        
                        {domainData && (
                          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Total Actions Today</span>
                              <span className="text-lg font-bold text-primary">{domainData.totalActions}</span>
                            </div>
                            {domainData.lastActivity && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last activity: {new Date(domainData.lastActivity).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Real-time User Risk Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        User Risk Assessment
                        <Badge variant="secondary" className="bg-chat-active/20 text-chat-active-foreground border-chat-active/30">
                          <div className="w-2 h-2 bg-chat-active rounded-full mr-1 animate-pulse"></div>
                          LIVE
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userRiskData.length > 0 ? userRiskData.slice(0, 5).map((user, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 ${getRiskColor(user.risk)} rounded-full`}></div>
                              <div>
                                <span className="text-sm font-medium">User {user.userId.slice(-6)}</span>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(user.lastActivity).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-lg font-bold">{Math.round(user.recoveryStrength)}%</div>
                                <div className="text-xs text-muted-foreground">{user.activityCount} actions</div>
                              </div>
                              <Badge className={getRiskBadge(user.risk)}>
                                {user.risk.charAt(0).toUpperCase() + user.risk.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        )) : domainLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground text-sm mt-2">Analyzing user risk...</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4 text-sm">No user data available yet.</p>
                        )}
                        
                        {userRiskData.length > 0 && (
                          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <div className="text-lg font-bold text-destructive">
                                  {userRiskData.filter(u => u.risk === 'high').length}
                                </div>
                                <div className="text-xs text-muted-foreground">High Risk</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-warning-foreground">
                                  {userRiskData.filter(u => u.risk === 'medium').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Medium Risk</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-chat-active-foreground">
                                  {userRiskData.filter(u => u.risk === 'low').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Low Risk</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specialists">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Specialist Management</h2>
                  <p className="text-muted-foreground">Monitor and manage peer support specialists</p>
                </div>
              </div>

              {/* Specialist Performance Overview */}
              {analytics?.specialistAnalytics && <>
                  <SpecialistOverviewCards specialistAnalytics={analytics.specialistAnalytics} onEditSpecialist={handleEditSpecialist} onResetPassword={handleResetPassword} onDeactivateSpecialist={handleDeactivateSpecialist} />
                  
                  {/* Specialist Toolbar */}
                  <SpecialistToolbar
                    specialists={analytics.specialistAnalytics.specialistPerformance}
                    searchTerm={specialistSearchTerm}
                    onSearchChange={handleSpecialistSearch}
                    filterStatus={specialistFilterStatus}
                    onFilterChange={handleSpecialistFilter}
                    onExportData={handleExportSpecialistData}
                    onInviteSpecialist={handleInviteSpecialist}
                    onRefresh={refreshData}
                    isLoading={isLoading}
                  />
                  
                  <SpecialistPerformanceTable specialists={filteredSpecialists} />
                </>}
              
              {/* Original Specialist Management */}
              <div className="mt-8">
                
                <PeerSpecialistManagement />
              </div>
            </div>
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

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">EAP Analytics</h2>
                <p className="text-muted-foreground">HIPAA-compliant employer insights and program effectiveness metrics</p>
              </div>
              <EmployerAnalyticsDashboard orgId="leap-platform" orgName="LEAP Platform" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default AdminDashboard;