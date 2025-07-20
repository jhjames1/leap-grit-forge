import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, LogOut, Settings, User, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SpecialistSettings from './SpecialistSettings';
import SpecialistChatWindow from './SpecialistChatWindow';
import RobustSpecialistChatWindow from './RobustSpecialistChatWindow';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';
import { logger } from '@/utils/logger';

interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  session_number: number;
  user_first_name?: string;
  user_last_name?: string;
}

const PeerSpecialistDashboard = () => {
  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const messages = [
      "Your dedication makes a real difference in people's lives.",
      "Keep shining your light – your support is invaluable.",
      "Remember, every small act of kindness creates a ripple.",
      "You're doing great work; take pride in your contributions.",
      "Your empathy and understanding bring comfort to others."
    ];
    setMotivationalMessage(messages[Math.floor(Math.random() * messages.length)]);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSpecialistData = async () => {
      try {
        setLoading(true);
        const { data: specialistData, error: specialistError } = await supabase
          .from('peer_specialists')
          .select(`
            *,
            specialist_status (
              status,
              status_message,
              last_active
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (specialistError) throw specialistError;

        if (!specialistData) {
          // If no specialist profile, redirect to create one
          navigate('/specialist-signup');
          return;
        }

        setSpecialist(specialistData);
      } catch (err: any) {
        logger.error('Error fetching specialist data:', err);
        setError(err.message || 'Failed to load specialist data');
      } finally {
        setLoading(false);
      }
    };

    const fetchChatSessions = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .or(`specialist_id.eq.${specialist?.id},user_id.eq.${user.id}`)
          .order('started_at', { ascending: false });

        if (sessionError) throw sessionError;
        setSessions((sessionData || []).map(session => ({
          ...session,
          status: session.status as 'waiting' | 'active' | 'ended'
        })));
      } catch (err: any) {
        logger.error('Error fetching chat sessions:', err);
        setError(err.message || 'Failed to load chat sessions');
      }
    };

    fetchSpecialistData();
    if (specialist) {
      fetchChatSessions();
    }
  }, [user, navigate, specialist]);

  useEffect(() => {
    if (specialist) {
      const fetchChatSessions = async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .or(`specialist_id.eq.${specialist?.id},user_id.eq.${user.id}`)
            .order('started_at', { ascending: false });
    
          if (sessionError) throw sessionError;
    
          // Get user profiles separately
          const sessionDataWithProfiles = await Promise.all(
            (sessionData || []).map(async (session) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', session.user_id)
                .single();
              
              return {
                ...session,
                status: session.status as 'waiting' | 'active' | 'ended',
                user_first_name: profile?.first_name || null,
                user_last_name: profile?.last_name || null,
              };
            })
          );
    
          setSessions(sessionDataWithProfiles);
        } catch (err: any) {
          logger.error('Error fetching chat sessions:', err);
          setError(err.message || 'Failed to load chat sessions');
        }
      };
      fetchChatSessions();
    }
  }, [specialist]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive"
      });
    } else {
      navigate('/login');
    }
  };

  const handleSessionClick = (session: ChatSession) => {
    setActiveSession(session);
  };

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    setActiveSession(updatedSession);
  };

  const handleCloseChatWindow = () => {
    setActiveSession(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="text-primary" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Peer Support Dashboard</h1>
              <p className="text-muted-foreground">Monitor and manage your support sessions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2"
            >
              <User size={16} />
              <span>Profile</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      {specialist && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border p-6">
          <div className="max-w-4xl">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Welcome back, {specialist.first_name} {specialist.last_name}!
            </h2>
            <p className="text-muted-foreground italic">
              {motivationalMessage}
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {/* Active Chat Sessions */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Active Chat Sessions</h2>
          </div>
          <div className="p-4 space-y-4">
            {sessions.filter(session => session.status !== 'ended').length > 0 ? (
              sessions
                .filter(session => session.status !== 'ended')
                .map(session => (
                  <Card
                    key={session.id}
                    className="bg-muted hover:bg-muted/80 cursor-pointer"
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <h3 className="text-sm font-medium">{session.user_first_name} {session.user_last_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Session #{session.session_number} - {session.status}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.status === 'waiting' && (
                          <Button size="sm" variant="outline">
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No active chat sessions available.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Calendar */}
        <Card className="col-span-1">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Schedule</h2>
          </div>
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => setShowCalendar(true)}
            >
              <CalendarIcon size={16} className="mr-2" />
              View Calendar
            </Button>
          </div>
        </Card>
      </div>

      {/* Settings Modal */}
      {specialist && (
        <SpecialistSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          specialist={specialist}
          onUpdateSpecialist={setSpecialist}
        />
      )}

      {/* Calendar Modal */}
      {showCalendar && specialist?.id && (
        <EnhancedSpecialistCalendar
          specialistId={specialist.id}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Chat Window */}
      {activeSession && (
        <div className="fixed inset-0 z-50">
          <RobustSpecialistChatWindow
            session={activeSession}
            onClose={handleCloseChatWindow}
            onSessionUpdate={handleSessionUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default PeerSpecialistDashboard;
