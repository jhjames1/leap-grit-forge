import React, { useState } from 'react';
import { Calendar, ChevronDown, Download, Menu, X } from 'lucide-react';
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

export default function ConocoPortal() {
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeSection, setActiveSection] = useState('overview');

  const handleExport = () => {
    // Export functionality will be implemented
    console.log('Exporting data...');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ConocoSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">L</span>
                </div>
                <h1 className="font-semibold text-lg">LEAP EAP Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Range Picker */}
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {/* Department Dropdown */}
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
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
                <h2 className="text-2xl font-bold">Engagement Analytics</h2>
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
                <h2 className="text-2xl font-bold">Well-Being Trends</h2>
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
                <h2 className="text-2xl font-bold">Program Health</h2>
                <ConocoDashboardStats 
                  dateRange={selectedDateRange}
                  department={selectedDepartment}
                />
              </div>
            )}

            {activeSection === 'alerts' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
                <ConocoAlertsPanel />
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Dashboard Settings</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Dashboard settings will be available here.</p>
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