
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Clock,
  Star,
  TrendingUp,
  Activity,
  Phone,
  Video,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SpecialistChatWindow from './SpecialistChatWindow';
import SpecialistCalendar from './calendar/SpecialistCalendar';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import SpecialistSettings from './SpecialistSettings';
import SpecialistAnalyticsDashboard from './SpecialistAnalyticsDashboard';
import RecentActivityDisplay from './RecentActivityDisplay';
import { format } from 'date-fns';

interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}

const PeerSpecialistDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingSessions, setPendingSessions] = useState<ChatSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [specialistData, setSpecialistData] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    sessionsToday: 0,
    avgResponseTime: 0,
    appointmentsToday: 0,
    totalUsers: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSpecialistData();
      loadChatSessions();
      loadTodayStats();
      setupRealTimeSubscriptions();
    }
  }, [user]);

  const loadSpecialistData = async () => {
    try {
      const { data, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSpecialistData(data);
    } catch (error) {
      console.error('Error loading specialist data:', error);
    }
  };

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialistData?.id)
        .in('status', ['waiting', 'active']);

      if (error) throw error;

      const waiting = data?.filter(session => session.status === 'waiting') || [];
      const active = data?.filter(session => session.status === 'active') || [];
      
      setPendingSessions(waiting);
      setActiveSessions(active);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Count today's sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('specialist_id', specialistData?.id)
        .gte('started_at', `${today}T00:00:00`)
        .lt('started_at', `${today}T23:59:59`);

      if (sessionsError) throw sessionsError;

      // Count today's appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('specialist_appointments')
        .select('id')
        .eq('specialist_id', specialistData?.id)
        .gte('scheduled_start', `${today}T00:00:00`)
        .lt('scheduled_start', `${today}T23:59:59`);

      if (appointmentsError) throw appointmentsError;

      // Count total unique users
      const { data: usersData, error: usersError } = await supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('specialist_id', specialistData?.id);

      if (usersError) throw usersError;

      const uniqueUsers = new Set(usersData?.map(session => session.user_id)).size;

      setTodayStats({
        sessionsToday: sessionsData?.length || 0,
        avgResponseTime: 2.5, // This would come from performance metrics
        appointmentsToday: appointmentsData?.length || 0,
        totalUsers: uniqueUsers
      });
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    const channel = supabase
      .channel('specialist-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions',
        filter: `specialist_id=eq.${specialistData?.id}`
      }, () => {
        loadChatSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcceptSession = async (session: ChatSession) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      if (error) throw error;
      
      setSelectedSession(session);
      loadChatSessions();
    } catch (error) {
      console.error('Error accepting session:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, change }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp size={12} className="mr-1" />
              {change}
            </p>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </Card>
  );

  if (selectedSession) {
    return (
      <SpecialistChatWindow 
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Specialist Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {specialistData?.first_name} {specialistData?.last_name}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat Sessions</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Sessions Today"
                value={todayStats.sessionsToday}
                icon={MessageSquare}
                change="+12% from yesterday"
              />
              <StatCard
                title="Avg Response Time"
                value={`${todayStats.avgResponseTime}min`}
                icon={Clock}
                change="-8% from yesterday"
              />
              <StatCard
                title="Appointments Today"
                value={todayStats.appointmentsToday}
                icon={Calendar}
              />
              <StatCard
                title="Total Users"
                value={todayStats.totalUsers}
                icon={Users}
                change="+5 this week"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Sessions */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="text-orange-500" size={20} />
                    Pending Sessions ({pendingSessions.length})
                  </h3>
                </div>
                
                {pendingSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No pending sessions</p>
                    <p className="text-sm">New chat requests will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">New Chat Request</p>
                          <p className="text-sm text-muted-foreground">
                            Started {format(new Date(session.started_at), 'HH:mm')}
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleAcceptSession(session)}
                        >
                          Accept
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Activity */}
              <RecentActivityDisplay specialistId={specialistData?.id} />
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Sessions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="text-green-500" size={20} />
                  Active Sessions ({activeSessions.length})
                </h3>
                
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No active sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Active Chat</p>
                          <p className="text-sm text-muted-foreground">
                            Started {format(new Date(session.started_at), 'HH:mm')}
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          Join Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Pending Sessions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="text-orange-500" size={20} />
                  Pending Sessions ({pendingSessions.length})
                </h3>
                
                {pendingSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No pending sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">New Chat Request</p>
                          <p className="text-sm text-muted-foreground">
                            Waiting since {format(new Date(session.started_at), 'HH:mm')}
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleAcceptSession(session)}
                        >
                          Accept
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <SpecialistCalendar specialistId={specialistData?.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <SpecialistAnalyticsDashboard specialistId={specialistData?.id} />
          </TabsContent>

          <TabsContent value="settings">
            <SpecialistSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PeerSpecialistDashboard;
