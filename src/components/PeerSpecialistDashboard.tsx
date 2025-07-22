import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  MessageSquare,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import SpecialistStatusIndicator from '@/components/SpecialistStatusIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserAuth from '@/components/UserAuth';
import { TestingModeControls } from '@/components/TestingModeControls';
import { useProfile } from '@/hooks/useProfile';
import SpecialistChat from '@/components/SpecialistChat';
import ProposalManagement from '@/components/ProposalManagement';
import SpecialistAnalytics from '@/components/SpecialistAnalytics';
import SpecialistSettings from '@/components/SpecialistSettings';
import SpecialistCalendar from '@/components/SpecialistCalendar';

interface PeerSpecialistDashboardProps {
  specialistId: string | null;
  appointmentNotifications?: {
    newAppointments: number;
    hasNewAppointments: boolean;
    clearNewAppointments: () => void;
  };
}

const PeerSpecialistDashboard: React.FC<PeerSpecialistDashboardProps> = ({ 
  specialistId, 
  appointmentNotifications 
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { profile } = useProfile();
  const [sessionMetrics, setSessionMetrics] = useState({
    totalSessions: 0,
    activeSessions: 0,
    waitingSessions: 0,
  });
  const [proposalNotifications, setProposalNotifications] = useState({
    pendingCount: 0,
    hasNewResponses: false
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Clear appointment notifications when viewing calendar
    if (value === 'calendar' && appointmentNotifications?.hasNewAppointments) {
      appointmentNotifications.clearNewAppointments();
    }
    
    // Clear proposal notifications when viewing proposals
    if (value === 'proposals' && proposalNotifications.hasNewResponses) {
      setProposalNotifications(prev => ({
        ...prev,
        hasNewResponses: false
      }));
    }
  };

  useEffect(() => {
    // Mock data for session metrics
    setSessionMetrics({
      totalSessions: 15,
      activeSessions: 3,
      waitingSessions: 2,
    });

    // Mock data for proposal notifications
    setProposalNotifications({
      pendingCount: 5,
      hasNewResponses: true
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Peer Specialist Portal</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.first_name}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Appointment notification badge */}
            {appointmentNotifications?.hasNewAppointments && (
              <div className="relative">
                <Calendar className="w-6 h-6 text-blue-600" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {appointmentNotifications.newAppointments}
                </Badge>
              </div>
            )}
            
            <SpecialistStatusIndicator specialistId={specialistId} />
            <TestingModeControls />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserAuth onLogin={() => {}} />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {sessionMetrics.waitingSessions > 1 && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.214-1.36 2.979 0l8.93 15.8a1.5 1.5 0 01-1.42 2.605H2.697a1.5 1.5 0 01-1.42-2.605l8.93-15.8zM11 5a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 100 2 1 1 0 000-2zm1 3a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {sessionMetrics.waitingSessions} new clients are waiting to chat!
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat Sessions
              {sessionMetrics.waitingSessions > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {sessionMetrics.waitingSessions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
              {appointmentNotifications?.hasNewAppointments && (
                <Badge variant="destructive" className="ml-2">
                  {appointmentNotifications.newAppointments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proposals">
              <FileText className="w-4 h-4 mr-2" />
              Proposals
              {proposalNotifications.pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {proposalNotifications.pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-1">
            <p className="text-muted-foreground">
              Here's an overview of your specialist activity.
            </p>
          </TabsContent>
          <TabsContent value="chat" className="space-y-1">
            <SpecialistChat specialistId={specialistId} />
          </TabsContent>
          <TabsContent value="calendar" className="space-y-1">
            <SpecialistCalendar specialistId={specialistId} />
          </TabsContent>
          <TabsContent value="proposals" className="space-y-1">
            <ProposalManagement specialistId={specialistId} />
          </TabsContent>
          <TabsContent value="analytics" className="space-y-1">
            <SpecialistAnalytics />
          </TabsContent>
          <TabsContent value="settings" className="space-y-1">
            <SpecialistSettings 
              isOpen={activeTab === 'settings'}
              onClose={() => setActiveTab('dashboard')}
              specialist={null}
              onUpdateSpecialist={() => {}}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export { PeerSpecialistDashboard };
