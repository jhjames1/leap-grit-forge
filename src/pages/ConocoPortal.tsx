import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Download, Menu, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ConocoDashboardStats } from '@/components/conoco/ConocoDashboardStats';
import { ConocoEngagementChart } from '@/components/conoco/ConocoEngagementChart';
import { ConocoFeatureUsage } from '@/components/conoco/ConocoFeatureUsage';
import { ConocoSentimentTrend } from '@/components/conoco/ConocoSentimentTrend';
import { ConocoThemeHeatmap } from '@/components/conoco/ConocoThemeHeatmap';
import { ConocoAlertsPanel } from '@/components/conoco/ConocoAlertsPanel';
import { ConocoSidebar } from '@/components/conoco/ConocoSidebar';
import ConocoLogin from '@/components/conoco/ConocoLogin';

export default function ConocoPortal() {
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeSection, setActiveSection] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('conoco-auth');
      setIsAuthenticated(authStatus === 'true');
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('conoco-auth');
    setIsAuthenticated(false);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleExport = () => {
    // Export functionality will be implemented
    console.log('Exporting data...');
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-construction mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <ConocoLogin onLogin={handleLogin} onBack={handleBack} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <ConocoSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/1a5c833d-7af4-41e8-b399-dbcb55e86c30.png" 
                  alt="ConocoPhillips" 
                  className="h-8 w-auto"
                />
                <h1 className="font-oswald font-semibold text-lg text-gray-800">LEAP Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Range Picker */}
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-800">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="7" className="text-gray-800 hover:bg-gray-100">Last 7 days</SelectItem>
                  <SelectItem value="30" className="text-gray-800 hover:bg-gray-100">Last 30 days</SelectItem>
                  <SelectItem value="90" className="text-gray-800 hover:bg-gray-100">Last 90 days</SelectItem>
                  <SelectItem value="custom" className="text-gray-800 hover:bg-gray-100">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {/* Department Dropdown */}
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-800">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all" className="text-gray-800 hover:bg-gray-100">All Departments</SelectItem>
                  <SelectItem value="hr" className="text-gray-800 hover:bg-gray-100">Human Resources</SelectItem>
                  <SelectItem value="engineering" className="text-gray-800 hover:bg-gray-100">Engineering</SelectItem>
                  <SelectItem value="sales" className="text-gray-800 hover:bg-gray-100">Sales</SelectItem>
                  <SelectItem value="marketing" className="text-gray-800 hover:bg-gray-100">Marketing</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button onClick={handleExport} variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              {/* Logout Button */}
              <Button onClick={handleLogout} variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50">
                Logout
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-gray-50">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <ConocoDashboardStats 
                  dateRange={selectedDateRange}
                  department={selectedDepartment}
                />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <ConocoEngagementChart 
                      dateRange={selectedDateRange}
                      department={selectedDepartment}
                    />
                  </div>
                  
                  <ConocoFeatureUsage 
                    dateRange={selectedDateRange}
                    department={selectedDepartment}
                  />
                  
                  <ConocoSentimentTrend 
                    dateRange={selectedDateRange}
                    department={selectedDepartment}
                  />
                  
                  <div className="lg:col-span-2">
                    <ConocoThemeHeatmap 
                      dateRange={selectedDateRange}
                      department={selectedDepartment}
                    />
                  </div>
                </div>

                {/* Alerts Panel */}
                <ConocoAlertsPanel />
              </div>
            )}

            {activeSection === 'engagement' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 font-oswald">Engagement Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ConocoEngagementChart 
                    dateRange={selectedDateRange}
                    department={selectedDepartment}
                  />
                  <ConocoFeatureUsage 
                    dateRange={selectedDateRange}
                    department={selectedDepartment}
                  />
                </div>
              </div>
            )}

            {activeSection === 'wellbeing' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 font-oswald">Well-Being Trends</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ConocoSentimentTrend 
                    dateRange={selectedDateRange}
                    department={selectedDepartment}
                  />
                  <ConocoThemeHeatmap 
                    dateRange={selectedDateRange}
                    department={selectedDepartment}
                  />
                </div>
              </div>
            )}

            {activeSection === 'program' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 font-oswald">Program Health</h2>
                <ConocoDashboardStats 
                  dateRange={selectedDateRange}
                  department={selectedDepartment}
                />
              </div>
            )}

            {activeSection === 'alerts' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 font-oswald">Alerts & Notifications</h2>
                <ConocoAlertsPanel />
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 font-oswald">Dashboard Settings</h2>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800 font-oswald">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Dashboard settings will be available here.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}