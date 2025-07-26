import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConocoLogin from '@/components/conoco/ConocoLogin';
import { ConocoDashboardStats } from '@/components/conoco/ConocoDashboardStats';
import { ConocoEngagementChart } from '@/components/conoco/ConocoEngagementChart';
import { ConocoFeatureUsage } from '@/components/conoco/ConocoFeatureUsage';
import { ConocoSentimentTrend } from '@/components/conoco/ConocoSentimentTrend';
import { ConocoThemeHeatmap } from '@/components/conoco/ConocoThemeHeatmap';
import { ConocoAlertsPanel } from '@/components/conoco/ConocoAlertsPanel';

interface DemoConocoPortalProps {
  onBack: () => void;
}

export function DemoConocoPortal({ onBack }: DemoConocoPortalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('30');

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Demo Banner */}
        <div className="bg-blue-600 text-white py-2 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">DEMO MODE - Corporate White Label Example</span>
            </div>
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
          </div>
        </div>

        {/* Educational Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Corporate White Label Demo
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Experience how LEAP transforms to match your company's brand and requirements
              </p>
              <Badge variant="secondary" className="mb-4">
                ConocoPhillips Implementation Example
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">✓ Complete Brand Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Custom logos and color schemes</li>
                    <li>• Company-specific terminology</li>
                    <li>• Integrated with corporate identity</li>
                    <li>• Custom domain support</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">📊 Executive Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Real-time engagement metrics</li>
                    <li>• Department-level insights</li>
                    <li>• ROI tracking and reporting</li>
                    <li>• Customizable KPI monitoring</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-600">🔒 Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• SSO integration</li>
                    <li>• Role-based access control</li>
                    <li>• Compliance reporting</li>
                    <li>• Data residency options</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">⚡ Rapid Deployment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 30-day implementation</li>
                    <li>• Dedicated success manager</li>
                    <li>• Custom training programs</li>
                    <li>• 24/7 enterprise support</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                The login below demonstrates the corporate-branded experience. 
                Demo credentials: <strong>admin / demo123</strong>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Login Component */}
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-md mx-auto">
            <ConocoLogin onLogin={handleLogin} onBack={onBack} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-blue-600 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">DEMO MODE - Corporate Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              Logout
            </Button>
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Corporate Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/6f20bf7a-2728-4c31-b889-6754478892ba.png" 
                alt="ConocoPhillips" 
                className="h-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800 font-oswald">
                  LEAP Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-600">Employee Assistance Program Insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <Badge variant="outline">Live Data</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Stats Overview */}
          <ConocoDashboardStats dateRange={selectedDateRange} department="all" />

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ConocoEngagementChart dateRange={selectedDateRange} department="all" />
            <ConocoFeatureUsage dateRange={selectedDateRange} department="all" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ConocoSentimentTrend dateRange={selectedDateRange} department="all" />
            <ConocoThemeHeatmap dateRange={selectedDateRange} department="all" />
          </div>

          {/* Alerts Panel */}
          <ConocoAlertsPanel />
        </div>
      </div>
    </div>
  );
}