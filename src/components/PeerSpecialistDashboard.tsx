import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Users, 
  Activity, 
  Settings, 
  Star,
  CalendarClock,
  Phone,
  Video,
  Bell,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSpecialistMetrics } from '@/hooks/useSpecialistMetrics';
import { useSpecialistPresence } from '@/hooks/useSpecialistPresence';
import { useCalendarAwarePresence } from '@/hooks/useCalendarAwarePresence';
import SpecialistChatWindow from './SpecialistChatWindow';
import SpecialistCalendar from './calendar/SpecialistCalendar';
import SpecialistSettings from './SpecialistSettings';
import SpecialistFavorites from './SpecialistFavorites';
import ScheduleManagementModal from './calendar/ScheduleManagementModal';
import RealTimeAvailabilityStatus from './calendar/RealTimeAvailabilityStatus';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Specialist {
  id: string;
  first_name: string;
  last_name: string;
  specialties: string[];
  bio: string;
  avatar_url?: string;
  is_verified: boolean;
  years_experience: number;
}

const PeerSpecialistDashboard = () => {
  const { user } = useAuth();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  
  const { 
    metrics, 
    loading: metricsLoading,
    refreshMetrics 
  } = useSpecialistMetrics();
  
  const { 
    updateStatus, 
    trackActivity,
    specialistStatuses 
  } = useSpecialistPresence();

  const { 
    calendarAvailability,
    manualStatus,
    isCalendarControlled,
    setManualAwayStatus,
    toggleCalendarControl 
  } = useCalendarAwarePresence();

  // Fetch specialist profile
  useEffect(() => {
    const fetchSpecialist = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('peer_specialists')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching specialist:', error);
          return;
        }

        setSpecialist(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialist();
  }, [user]);

  // Track activity when tab changes
  useEffect(() => {
    if (activeTab) {
      trackActivity('tab_change', { tab: activeTab });
    }
  }, [activeTab, trackActivity]);

  const handleStatusChange = async (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (status === 'away') {
      await setManualAwayStatus(true, 'Manually set to away');
    } else {
      await setManualAwayStatus(false);
      await updateStatus(status);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Specialist profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={specialist.avatar_url} />
                <AvatarFallback>
                  {specialist.first_name?.[0]}{specialist.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {specialist.first_name} {specialist.last_name}
                </h1>
                <div className="flex items-center space-x-2">
                  {specialist.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {specialist.years_experience} years experience
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Real-time Availability Status */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium">
                         Current Status: {calendarAvailability?.isAvailable ? 'Available' : 'Not Available'}
                       </span>
                      {calendarAvailability?.reason && (
                        <span className="text-sm text-muted-foreground">- {calendarAvailability.reason}</span>
                      )}
                    </div>
                  </div>
                  <RealTimeAvailabilityStatus 
                    specialistId={specialist.id} 
                    showDetails={false}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={manualStatus === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCalendarControl(!isCalendarControlled)}
                >
                  {isCalendarControlled ? 'Auto' : 'Manual'}
                </Button>
                
                <Button
                  variant={manualStatus === 'away' ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange('away')}
                >
                  Away
                </Button>
              </div>

              {/* Schedule Management */}
              <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <ScheduleManagementModal
                    isOpen={scheduleModalOpen}
                    onClose={() => setScheduleModalOpen(false)}
                    specialistId={specialist.id}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat Sessions</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : metrics?.activeSessions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : metrics?.todaySessions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Sessions today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : `${metrics?.avgResponseTime || 0}s`}
                  </div>
                  <p className="text-xs text-muted-foreground">Average response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : (metrics?.avgRating?.toFixed(1) || 'N/A')}
                  </div>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Upcoming Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.recentSessions?.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">Chat session started</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(session.started_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.upcomingAppointments?.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(appointment.scheduled_start), 'MMM d, h:mm a')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.meeting_type === 'video' ? 
                              <><Video className="w-3 h-3 inline mr-1" />Video call</> :
                              <><MessageSquare className="w-3 h-3 inline mr-1" />Chat session</>
                            }
                          </p>
                        </div>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Sessions Tab */}
          <TabsContent value="chat">
            <SpecialistChatWindow 
              specialistId={specialist.id}
              onSessionSelect={setSelectedChatSession}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <SpecialistCalendar specialistId={specialist.id} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Sessions</span>
                      <span className="font-semibold">{metrics?.totalSessions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-semibold">{metrics?.completionRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <span className="font-semibold">{metrics?.avgResponseTime || 0}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analytics data will be displayed here based on your recent performance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <SpecialistFavorites specialistId={specialist.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SpecialistSettings specialist={specialist} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PeerSpecialistDashboard;
