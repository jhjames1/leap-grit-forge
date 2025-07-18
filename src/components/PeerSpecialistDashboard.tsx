import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MessageCircle, User, Users, Settings, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PeerChat from '@/components/PeerChat';
import RecurringAppointmentScheduler from '@/components/RecurringAppointmentScheduler';
import BulkSchedulingTools from '@/components/calendar/BulkSchedulingTools';
import SpecialistAvailabilityCalendar from '@/components/calendar/SpecialistAvailabilityCalendar';

interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}

interface SpecialistData {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  avatar_url: string;
  is_active: boolean;
  is_verified: boolean;
}

const PeerSpecialistDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [specialistData, setSpecialistData] = useState<SpecialistData | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('User not found, redirecting to login');
      navigate('/login');
      return;
    }

    fetchSpecialistData();
    fetchActiveSessions();
  }, [user, navigate]);

  const fetchSpecialistData = async () => {
    try {
      const { data, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching specialist data:', error);
        toast({
          title: "Error",
          description: "Failed to load specialist data",
          variant: "destructive"
        });
      }

      setSpecialistData(data);
    } catch (error) {
      console.error('Error fetching specialist data:', error);
      toast({
        title: "Error",
        description: "Failed to load specialist data",
        variant: "destructive"
      });
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialistData?.id)
        .in('status', ['waiting', 'active']);

      if (error) {
        console.error('Error fetching active sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load active sessions",
          variant: "destructive"
        });
      }

      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load active sessions",
        variant: "destructive"
      });
    }
  };

  const handleSessionEnded = () => {
    setSelectedSession(null);
    fetchActiveSessions();
  };

  const handleScheduleUpdate = () => {
    setShowCalendar(true);
  };

  const renderActiveSessions = () => {
    if (activeSessions.length === 0) {
      return (
        <Card className="p-6 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-2">No Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            Waiting for users to start chat sessions
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {activeSessions.map((session) => (
          <Card key={session.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <h4 className="font-medium">
                    Session with User
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Started {format(new Date(session.started_at), 'MMM d, HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Add RecurringAppointmentScheduler here for active sessions */}
                <RecurringAppointmentScheduler
                  specialistId={specialistData?.id || ''}
                  userId={session.user_id}
                  chatSessionId={session.id}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSession(session)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4">
          <h2 className="font-bold text-lg">Peer Specialist Portal</h2>
          <p className="text-sm text-muted-foreground">
            Welcome, {specialistData?.name || 'Specialist'}
          </p>
        </div>

        <div className="flex-1 p-4">
          <nav className="grid gap-2">
            <Button variant="ghost" className="justify-start" onClick={() => setSelectedSession(null)}>
              <Users className="w-4 h-4 mr-2" />
              Active Sessions
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => setShowCalendar(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Availability Calendar
            </Button>
            <Button variant="ghost" className="justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </nav>
        </div>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSession ? 'Active Chat Session' : 'Active Sessions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <PeerChat
                specialistId={specialistData?.id || ''}
                specialistName={specialistData?.name || 'Specialist'}
                onBack={() => setSelectedSession(null)}
                onSessionEnded={handleSessionEnded}
              />
            ) : showCalendar ? (
              <SpecialistAvailabilityCalendar specialistId={specialistData?.id || ''} />
            ) : (
              renderActiveSessions()
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <BulkSchedulingTools specialistId={specialistData?.id || ''} onScheduleUpdate={handleScheduleUpdate} />
        </div>
      </div>
    </div>
  );
};

export default PeerSpecialistDashboard;
