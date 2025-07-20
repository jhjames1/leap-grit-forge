import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RobustSpecialistChatWindow from './RobustSpecialistChatWindow';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import SpecialistSettings from './SpecialistSettings';
import ProposalManagement from './ProposalManagement';
import { usePendingProposals } from '@/hooks/usePendingProposals';
import { useProposalNotifications } from '@/hooks/useProposalNotifications';

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

interface SpecialistProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  created_at: string;
}

const PeerSpecialistDashboard = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [specialistProfile, setSpecialistProfile] = useState<SpecialistProfile | null>(null);
  const [waitingSessions, setWaitingSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSpecialistProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('peer_specialists')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching specialist profile:", error);
          toast({
            title: "Error",
            description: "Failed to load specialist profile.",
            variant: "destructive",
          });
        }

        setSpecialistProfile(data);
      } catch (error) {
        console.error("Unexpected error fetching specialist profile:", error);
        toast({
          title: "Error",
          description: "Unexpected error loading specialist profile.",
          variant: "destructive",
        });
      }
    };

    fetchSpecialistProfile();
  }, [user, toast]);

  useEffect(() => {
    const fetchWaitingSessions = async () => {
      if (!specialistProfile) return;

      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('status', 'waiting')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching waiting sessions:", error);
          toast({
            title: "Error",
            description: "Failed to load waiting chat sessions.",
            variant: "destructive",
          });
        }

        // Filter sessions to only include those without a specialist assigned
        const filteredSessions = (data || []).filter(session => !session.specialist_id) as ChatSession[];
        setWaitingSessions(filteredSessions);
      } catch (error) {
        console.error("Unexpected error fetching waiting sessions:", error);
        toast({
          title: "Error",
          description: "Unexpected error loading waiting chat sessions.",
          variant: "destructive",
        });
      }
    };

    fetchWaitingSessions();
  }, [specialistProfile, toast]);

  const handleSessionClick = (session: ChatSession) => {
    setSelectedSession(session);
    setIsChatWindowOpen(true);
  };

  const handleCloseChatWindow = () => {
    setIsChatWindowOpen(false);
    setSelectedSession(null);
  };

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    setWaitingSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  };

  const pendingProposals = usePendingProposals(specialistProfile?.id || '');
  const proposalNotifications = useProposalNotifications(specialistProfile?.id || '');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Specialist Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                Logout
              </Button>
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Chats</span>
              {waitingSessions.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {waitingSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
            
            <TabsTrigger value="proposals" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Proposals</span>
              {pendingProposals.pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-yellow-100 text-yellow-800">
                  {pendingProposals.pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Metrics</span>
            </TabsTrigger>
            
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Chat Sessions</h2>
                <p className="text-muted-foreground">
                  Manage and claim waiting chat sessions
                </p>
              </div>
              <Badge variant="outline">
                {waitingSessions.length} Waiting
              </Badge>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {waitingSessions.map((session) => (
                <Card key={session.id} className="cursor-pointer hover:opacity-75 transition-opacity duration-200" onClick={() => handleSessionClick(session)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Session #{session.session_number}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Started: {new Date(session.started_at).toLocaleDateString()}
                    </p>
                    {session.user_first_name && session.user_last_name && (
                      <p className="text-sm text-muted-foreground">
                        User: {session.user_first_name} {session.user_last_name}
                      </p>
                    )}
                    <Badge variant="secondary">Waiting</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
                <p className="text-muted-foreground">
                  View and manage your appointments
                </p>
              </div>
            </div>
            {specialistProfile && (
              <EnhancedSpecialistCalendar specialistId={specialistProfile.id} />
            )}
          </TabsContent>

          <TabsContent value="proposals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Meeting Proposals</h2>
                <p className="text-muted-foreground">
                  Manage your appointment proposals and scheduling requests
                </p>
              </div>
              {pendingProposals.pendingCount > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {pendingProposals.pendingCount} Pending Response{pendingProposals.pendingCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {specialistProfile && (
              <ProposalManagement specialistId={specialistProfile.id} />
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Performance Metrics</h2>
                <p className="text-muted-foreground">
                  Track your performance and engagement
                </p>
              </div>
            </div>
            {specialistProfile && (
              <SpecialistPerformanceMetrics specialistId={specialistProfile.id} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                  Manage your profile and preferences
                </p>
              </div>
            </div>
            {specialistProfile && (
              <SpecialistSettings 
                isOpen={false}
                onClose={() => {}}
                specialist={specialistProfile}
                onUpdateSpecialist={() => {}}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {isChatWindowOpen && selectedSession && (
        <RobustSpecialistChatWindow
          session={selectedSession}
          onClose={handleCloseChatWindow}
          onSessionUpdate={handleSessionUpdate}
        />
      )}
    </div>
  );
};

export default PeerSpecialistDashboard;
