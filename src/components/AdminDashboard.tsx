
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import SecurityAuditPanel from './SecurityAuditPanel';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  MessageSquare,
  Target,
  Activity,
  Shield
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { t } = useLanguage();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  // Mock data - would come from backend
  const mockData = {
    totalUsers: 247,
    activeUsers: 189,
    avgStrength: 67,
    riskUsers: 12,
    engagementTrends: [
      { domain: t('admin.domains.peerSupport'), avg: 72, trend: '+5%' },
      { domain: t('admin.domains.selfCare'), avg: 68, trend: '+3%' },
      { domain: t('admin.domains.structure'), avg: 65, trend: '+2%' },
      { domain: t('admin.domains.mood'), avg: 61, trend: '-1%' },
      { domain: t('admin.domains.cravingControl'), avg: 58, trend: '-3%' }
    ],
    heatmapData: [
      { user: 'User001', strength: 85, lastActive: '2 hours ago', risk: 'low' },
      { user: 'User002', strength: 42, lastActive: '3 days ago', risk: 'medium' },
      { user: 'User003', strength: 23, lastActive: '1 week ago', risk: 'high' },
      { user: 'User004', strength: 78, lastActive: '1 hour ago', risk: 'low' },
      { user: 'User005', strength: 34, lastActive: '5 days ago', risk: 'high' }
    ]
  };

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
    <div className="p-4 pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">{t('admin.title')}</span><span className="font-fjalla font-extrabold italic">{t('admin.dashboardTitle')}</span>
          </h1>
          <p className="text-steel-light font-oswald">{t('admin.subtitle')}</p>
        </div>
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-steel text-steel-light hover:bg-steel/10"
        >
          {t('admin.back')}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-steel-dark border-steel">
          <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            {t('admin.tabs.security')}
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
              'bg-construction text-midnight' : 
              'border-steel text-steel-light hover:bg-steel/10'
            }
          >
            {t(`admin.timeframes.${period}`)}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-construction/20 p-2 rounded-lg">
              <Users className="text-construction" size={20} />
            </div>
            <div>
              <div className="text-2xl font-anton text-white">{mockData.totalUsers}</div>
              <div className="text-xs text-steel-light font-oswald">{t('admin.metrics.totalUsers')}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-construction/20 p-2 rounded-lg">
              <Activity className="text-construction" size={20} />
            </div>
            <div>
              <div className="text-2xl font-anton text-white">{mockData.activeUsers}</div>
              <div className="text-xs text-steel-light font-oswald">{t('admin.metrics.activeUsers')}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-construction/20 p-2 rounded-lg">
              <TrendingUp className="text-construction" size={20} />
            </div>
            <div>
              <div className="text-2xl font-anton text-white">{mockData.avgStrength}%</div>
              <div className="text-xs text-steel-light font-oswald">{t('admin.metrics.avgStrength')}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <AlertTriangle className="text-red-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-anton text-white">{mockData.riskUsers}</div>
              <div className="text-xs text-steel-light font-oswald">{t('admin.metrics.atRisk')}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Domain Engagement Trends */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction/20 p-2 rounded-lg">
            <BarChart3 className="text-construction" size={20} />
          </div>
          <h3 className="font-oswald font-semibold text-white">{t('admin.sections.domainEngagement')}</h3>
        </div>
        
        <div className="space-y-3">
          {mockData.engagementTrends.map((domain, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-steel-dark/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-construction rounded-full"></div>
                <span className="text-white font-medium">{domain.domain}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-steel-light">{domain.avg}%</span>
                <Badge className={`${domain.trend.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {domain.trend}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* User Risk Heatmap */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction/20 p-2 rounded-lg">
            <Target className="text-construction" size={20} />
          </div>
          <h3 className="font-oswald font-semibold text-white">{t('admin.sections.userRiskAssessment')}</h3>
        </div>
        
        <div className="space-y-3">
          {mockData.heatmapData.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-steel-dark/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 ${getRiskColor(user.risk)} rounded-full`}></div>
                <div>
                  <span className="text-white font-medium">{user.user}</span>
                  <p className="text-steel-light text-sm">{user.lastActive}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-lg font-anton text-construction">{user.strength}%</div>
                  <div className="text-xs text-steel-light">{t('admin.sections.strength')}</div>
                </div>
                <Badge className={getRiskBadge(user.risk)}>
                  {t(`admin.riskLevels.${user.risk}`)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecurityAuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
