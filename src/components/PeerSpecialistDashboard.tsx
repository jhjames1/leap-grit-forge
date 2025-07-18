import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Calendar, Users, Clock, CheckCircle, AlertCircle, ChevronRight, User, LogOut, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import SpecialistChatWindow from './SpecialistChatWindow';
import SpecialistCalendar from './calendar/SpecialistCalendar';
import ScheduleManagementModal from './calendar/ScheduleManagementModal';
import { useToast } from '@/hooks/use-toast';
interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}
interface PeerSpecialist {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bio: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  status: {
    status: 'online' | 'offline' | 'away';
    last_active: string | null;
  };
}
const PeerSpecialistDashboard = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatFilter, setChatFilter] = useState<'all' | 'waiting' | 'active'>('all');
  const [peerSpecialist, setPeerSpecialist] = useState<PeerSpecialist | null>(null);
  const [loading, setLoading] = useState(true);

  // Add state for selected chat session
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch peer specialist data FIRST
        const {
          data: specialistData,
          error: specialistError
        } = await supabase.from('peer_specialists').select('*, status:specialist_status(status, last_seen)').eq('user_id', user.id).single();
        if (specialistError) {
          console.error('Error fetching peer specialist data:', specialistError);
        } else if (specialistData) {
          // Add missing email and phone_number from auth user
          const specialistWithUserData = {
            ...specialistData,
            email: user.email || '',
            phone_number: user.phone || '',
            status: specialistData.status?.[0] || {
              status: 'offline' as const,
              last_active: null
            }
          };
          setPeerSpecialist(specialistWithUserData);

          // Now load chat sessions with the specialist ID
          await loadChatSessionsForSpecialist(specialistWithUserData.id);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);
  const loadChatSessionsForSpecialist = async (specialistId: string) => {
    console.log('Loading chat sessions for specialist:', specialistId);
    const {
      data,
      error
    } = await supabase.from('chat_sessions').select('*').eq('specialist_id', specialistId).order('started_at', {
      ascending: false
    });
    if (error) {
      console.error('Error fetching chat sessions:', error);
    } else {
      console.log('Loaded chat sessions:', data?.length || 0, 'sessions');
      // Type cast the status field to match our interface
      const typedSessions = (data || []).map(session => ({
        ...session,
        status: session.status as 'waiting' | 'active' | 'ended'
      }));
      setChatSessions(typedSessions);
    }
  };
  const loadChatSessions = async () => {
    if (!peerSpecialist) return;
    await loadChatSessionsForSpecialist(peerSpecialist.id);
  };

  // Separate effect for real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;
    console.log('Setting up real-time subscriptions for user:', user.id);

    // Set up real-time subscriptions for live updates
    const chatSessionsChannel = supabase.channel('chat-sessions-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_sessions'
    }, payload => {
      console.log('Real-time chat session change:', payload);
      loadChatSessions(); // Refresh sessions on any change
    }).subscribe();
    const appointmentProposalsChannel = supabase.channel('appointment-proposals-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointment_proposals'
    }, payload => {
      console.log('Real-time appointment proposal change:', payload);
      loadChatSessions(); // Refresh to pick up new proposals
    }).subscribe();
    const chatMessagesChannel = supabase.channel('chat-messages-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_messages'
    }, payload => {
      console.log('Real-time chat message change:', payload);
      loadChatSessions(); // Refresh sessions when messages change
    }).subscribe();
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(chatSessionsChannel);
      supabase.removeChannel(appointmentProposalsChannel);
      supabase.removeChannel(chatMessagesChannel);
    };
  }, [user?.id]);
  const filterSessions = () => {
    if (chatFilter === 'all') {
      return chatSessions;
    } else {
      return chatSessions.filter(session => session.status === chatFilter);
    }
  };
  const handleChatClick = (session: ChatSession) => {
    setSelectedChatSession(session);
  };
  const handleCloseChatWindow = () => {
    setSelectedChatSession(null);
    // Refresh sessions after closing
    loadChatSessions();
  };
  const handleStatusChange = async (newStatus: 'online' | 'away' | 'offline') => {
    if (!peerSpecialist) return;
    
    try {
      // First, try to update existing status
      const { data: updateData, error: updateError } = await supabase
        .from('specialist_status')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('specialist_id', peerSpecialist.id)
        .select();

      // If no rows were updated (status doesn't exist), create it
      if (updateData && updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('specialist_status')
          .insert({
            specialist_id: peerSpecialist.id,
            status: newStatus,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      // Update local state
      setPeerSpecialist(prev => prev ? {
        ...prev,
        status: {
          ...prev.status,
          status: newStatus
        }
      } : null);
      
      toast({
        title: "Status Updated",
        description: `Your status has been changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Check if there are active or waiting sessions
  const hasActiveSessions = chatSessions.some(session => session.status === 'active' || session.status === 'waiting');
  const handleLogout = async () => {
    if (hasActiveSessions) {
      toast({
        title: "Cannot Log Out",
        description: "Please complete or close all active and waiting sessions before logging out.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Set status to offline before logging out
      if (peerSpecialist) {
        await supabase
          .from('specialist_status')
          .update({
            status: 'offline',
            updated_at: new Date().toISOString()
          })
          .eq('specialist_id', peerSpecialist.id);
      }

      // Sign out the user
      const {
        error
      } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleUpdateSpecialist = (updatedSpecialist: any) => {
    setPeerSpecialist(updatedSpecialist);
  };

  // Helper function to check if waiting session has been waiting more than 45 seconds
  const isWaitingTooLong = (session: ChatSession) => {
    if (session.status !== 'waiting') return false;
    const now = new Date();
    const startTime = new Date(session.started_at);
    const waitTime = now.getTime() - startTime.getTime();
    return waitTime > 45000; // 45 seconds in milliseconds
  };

  // Check if there are more than 2 users waiting
  const waitingSessions = chatSessions.filter(s => s.status === 'waiting');
  const hasMultipleWaitingSessions = waitingSessions.length > 2;
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-fjalla font-bold">Peer Support Specialist Dashboard</h1>
            <p className="text-muted-foreground font-source">Manage your chat sessions and support users in their recovery journey.</p>
          </div>
          <div className="flex items-center space-x-4">
            {peerSpecialist?.status && <div className="flex items-center space-x-3">
                <Select value={peerSpecialist.status.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-32 bg-background border-border z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border shadow-lg z-50">
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Online
                      </div>
                    </SelectItem>
                    <SelectItem value="away">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Away
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        Offline
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowScheduleModal(true)}
            >
              <Settings size={16} className="mr-2" />
              Manage Schedule
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={hasActiveSessions}>
              <LogOut size={16} className="mr-2" />
              {hasActiveSessions ? 'Sessions Active' : 'Log Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Specialist Name */}
        {peerSpecialist && <div className="mb-6">
            <h2 className="text-xl font-fjalla font-bold text-foreground">
              {peerSpecialist.first_name} {peerSpecialist.last_name}
            </h2>
            <p className="text-muted-foreground font-source">Peer Support Specialist</p>
          </div>}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Active Sessions</h3>
              <p className="text-muted-foreground font-source">Current live chat sessions</p>
            </div>
            <Badge variant="default">{chatSessions.filter(s => s.status === 'active').length}</Badge>
          </Card>
          <Card className={`flex items-center justify-between p-6 ${hasMultipleWaitingSessions ? 'bg-warning border-warning-foreground/20' : ''}`}>
            <div>
              <h3 className="text-lg font-fjalla font-bold">Waiting Sessions</h3>
              <p className="text-muted-foreground font-source">Users waiting for a response</p>
            </div>
            <Badge variant="secondary">{chatSessions.filter(s => s.status === 'waiting').length}</Badge>
          </Card>
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Completed Sessions</h3>
              <p className="text-muted-foreground font-source">Total sessions completed today</p>
            </div>
            <Badge variant="outline">{chatSessions.filter(s => s.status === 'ended').length}</Badge>
          </Card>
        </div>

        {/* Chat Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chat Sessions List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-fjalla font-bold">Chat Sessions</h2>
              <div className="flex gap-2">
                <Button size="sm" variant={chatFilter === 'all' ? 'default' : 'outline'} onClick={() => setChatFilter('all')}>
                  All ({chatSessions.length})
                </Button>
                <Button size="sm" variant={chatFilter === 'waiting' ? 'default' : 'outline'} onClick={() => setChatFilter('waiting')}>
                  Waiting ({chatSessions.filter(s => s.status === 'waiting').length})
                </Button>
                <Button size="sm" variant={chatFilter === 'active' ? 'default' : 'outline'} onClick={() => setChatFilter('active')}>
                  Active ({chatSessions.filter(s => s.status === 'active').length})
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filterSessions().length > 0 ? filterSessions().map(session => <div key={session.id} className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedChatSession?.id === session.id ? 'border-primary bg-primary/5' : 'border-border'} ${isWaitingTooLong(session) ? 'bg-warning border-warning-foreground/20' : ''}`} onClick={() => handleChatClick(session)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="text-primary" size={16} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-fjalla font-bold">Chat Session</span>
                            <Badge variant={session.status === 'active' ? 'default' : session.status === 'waiting' ? 'secondary' : 'outline'}>
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-source">
                            Started {format(new Date(session.started_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </div>) : <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-source">No {chatFilter !== 'all' ? chatFilter : ''} chat sessions</p>
                </div>}
            </div>
          </Card>

          {/* Chat Window or Welcome */}
          <Card className="p-0 overflow-hidden">
            {selectedChatSession ? <SpecialistChatWindow session={selectedChatSession} onClose={handleCloseChatWindow} /> : <div className="p-6 text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-fjalla font-bold mb-2">Select a Chat Session</h3>
                <p className="text-muted-foreground font-source">
                  Choose a chat session from the list to start helping users with their recovery journey.
                </p>
              </div>}
          </Card>
        </div>

        {/* Calendar Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-fjalla font-bold">Your Schedule</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowScheduleModal(true)}
              >
                <Settings size={16} className="mr-2" />
                Schedule Settings
              </Button>
            </div>
          </div>
          {peerSpecialist && (
            <SpecialistCalendar specialistId={peerSpecialist.id} />
          )}
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <h2 className="text-xl font-fjalla font-bold mb-4">Recent Activity</h2>
          <Card className="p-6">
            <p className="text-muted-foreground font-source">No recent activity to display.</p>
          </Card>
        </div>
      </div>

      {/* Schedule Management Modal */}
      {peerSpecialist && (
        <ScheduleManagementModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          specialistId={peerSpecialist.id}
        />
      )}
    </div>
  );
};

export default PeerSpecialistDashboard;
