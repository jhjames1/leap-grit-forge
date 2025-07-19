import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Calendar, Users, Clock, CheckCircle, AlertCircle, ChevronRight, User, LogOut, CalendarClock, AlertTriangle, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import SpecialistChatWindow from './SpecialistChatWindow';
import SpecialistCalendar from './calendar/SpecialistCalendar';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistStatus } from '@/hooks/useSpecialistStatus';
import { logger } from '@/utils/logger';
import ScheduleManagementModal from './calendar/ScheduleManagementModal';
import { useProposalNotifications } from '@/hooks/useProposalNotifications';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';

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
  pending_proposals_count?: number;
  has_new_responses?: boolean;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [peerSpecialist, setPeerSpecialist] = useState<PeerSpecialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Performance monitoring ref
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  // Increment render count for debugging
  renderCount.current += 1;
  logger.debug(`PeerSpecialistDashboard render`, { 
    renderCount: renderCount.current, 
    mountedTime: Date.now() - mountTime.current 
  });

  const currentSpecialistId = peerSpecialist?.id;

  const {
    status: effectiveStatus,
    loading: statusLoading,
    error: statusError,
    updateStatus,
    clearError
  } = useSpecialistStatus(currentSpecialistId);

  // Add proposal notifications
  const { pendingCount, hasNewResponses, clearNewResponses } = useProposalNotifications(
    currentSpecialistId || ''
  );

  // Load specialist data and sessions with useCallback to prevent recreation
  const loadData = useCallback(async () => {
    if (!user) return;
    
    logger.debug('Loading specialist data for user', { userId: user.id });
    setLoading(true);
    
    try {
      // Fetch peer specialist data
      const { data: specialistData, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('*, status:specialist_status(status, last_seen)')
        .eq('user_id', user.id)
        .single();

      if (specialistError) {
        logger.error('Error fetching peer specialist data', specialistError);
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

        // Load chat sessions for this specialist
        await loadChatSessions(specialistWithUserData.id);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadChatSessions = useCallback(async (specialistId: string) => {
    logger.debug('Loading chat sessions for specialist', { specialistId });
    
    // Load both assigned sessions and unassigned waiting sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .or(`specialist_id.eq.${specialistId},and(specialist_id.is.null,status.eq.waiting)`)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      logger.error('Error loading chat sessions', sessionsError);
      return;
    }

    // Then get the profile data for each session
    const sessionIds = (sessionsData || []).map(session => session.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', sessionIds);

    // Get proposal counts for each session
    const { data: proposalData } = await supabase
      .from('appointment_proposals')
      .select('chat_session_id, status, responded_at')
      .eq('specialist_id', specialistId)
      .in('chat_session_id', (sessionsData || []).map(s => s.id).filter(Boolean));

    // Combine the data
    const typedSessions = (sessionsData || []).map(session => {
      const profile = profilesData?.find(p => p.user_id === session.user_id);
      const sessionProposals = proposalData?.filter(p => p.chat_session_id === session.id) || [];
      const pendingProposals = sessionProposals.filter(p => p.status === 'pending');
      const hasNewResponses = sessionProposals.some(p => 
        p.status !== 'pending' && p.responded_at && 
        new Date(p.responded_at) > new Date(session.started_at)
      );
      
      return {
        ...session,
        status: session.status as 'waiting' | 'active' | 'ended',
        user_first_name: profile?.first_name,
        user_last_name: profile?.last_name,
        pending_proposals_count: pendingProposals.length,
        has_new_responses: hasNewResponses
      };
    });
    
    setChatSessions(typedSessions);
    logger.debug('Loaded chat sessions with profiles and proposals', { count: typedSessions.length });
  }, []);

  // Load data when component mounts or user changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions with improved cleanup
  useEffect(() => {
    if (!user?.id) return;
    
    logger.debug('Setting up real-time subscriptions for user', { userId: user.id });

    const chatSessionsChannel = supabase
      .channel(`chat-sessions-realtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, payload => {
        logger.debug('Real-time chat session change', payload);
        loadChatSessions(currentSpecialistId || '');
      })
      .subscribe();

    const appointmentProposalsChannel = supabase
      .channel(`appointment-proposals-realtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointment_proposals'
      }, payload => {
        logger.debug('Real-time appointment proposal change', payload);
        loadChatSessions(currentSpecialistId || '');
      })
      .subscribe();

    const chatMessagesChannel = supabase
      .channel(`chat-messages-realtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, payload => {
        logger.debug('Real-time chat message change', payload);
        loadChatSessions(currentSpecialistId || '');
      })
      .subscribe();

    const statusChannel = supabase
      .channel(`specialist-status-realtime-${currentSpecialistId || 'unknown'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'specialist_status',
        filter: currentSpecialistId ? `specialist_id=eq.${currentSpecialistId}` : undefined
      }, payload => {
        logger.debug('Real-time status change', payload);
        // Status updates are handled by the useSpecialistStatus hook
      })
      .subscribe();

    return () => {
      logger.debug('Cleaning up real-time subscriptions');
      supabase.removeChannel(chatSessionsChannel);
      supabase.removeChannel(appointmentProposalsChannel);
      supabase.removeChannel(chatMessagesChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [user?.id, currentSpecialistId, loadChatSessions]);

  // Sort sessions by priority: waiting first, then active
  // Within each group, sort by most recent first
  const getSortedActiveSessions = () => {
    return chatSessions
      .filter(session => session.status === 'waiting' || session.status === 'active')
      .sort((a, b) => {
        // First sort by status priority
        const statusPriority = { waiting: 0, active: 1 };
        const aPriority = statusPriority[a.status];
        const bPriority = statusPriority[b.status];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Within same status, sort by most recent first
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
      });
  };

  // Sort ended sessions by most recent first
  const getSortedEndedSessions = () => {
    return chatSessions
      .filter(session => session.status === 'ended')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  };

  const handleChatClick = async (session: ChatSession) => {
    // If this is an unassigned waiting session, assign it to this specialist
    if (session.status === 'waiting' && !session.specialist_id && peerSpecialist) {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ specialist_id: peerSpecialist.id })
          .eq('id', session.id);

        if (error) {
          console.error('Error claiming session:', error);
          toast({
            title: "Error",
            description: "Failed to claim this session. Please try again.",
            variant: "destructive"
          });
          return;
        }

        // Update local state
        setChatSessions(prev => prev.map(s => 
          s.id === session.id ? { ...s, specialist_id: peerSpecialist.id } : s
        ));

        // Update the selected session
        setSelectedChatSession({ ...session, specialist_id: peerSpecialist.id });

        toast({
          title: "Session Claimed",
          description: "You are now assigned to this chat session.",
        });
      } catch (error) {
        console.error('Error claiming session:', error);
        toast({
          title: "Error",
          description: "Failed to claim this session. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      setSelectedChatSession(session);
    }
  };

  const handleCloseChatWindow = () => {
    setSelectedChatSession(null);
    if (peerSpecialist) {
      loadChatSessions(peerSpecialist.id);
    }
  };

  const handleStatusChange = async (newStatus: 'online' | 'away' | 'offline') => {
    try {
      await updateStatus(newStatus, `Manually set to ${newStatus}`);
      toast({
        title: "Status Updated",
        description: `Your status has been changed to ${newStatus}`,
      });
    } catch (error) {
      // Error handling is done in the hook
      toast({
        title: "Status Update Failed",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

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
      if (currentSpecialistId) {
        await updateStatus('offline', 'Logging out');
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      logger.error('Error logging out', error);
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

  // Get session counts
  const waitingSessions = chatSessions.filter(s => s.status === 'waiting');
  const activeSessions = chatSessions.filter(s => s.status === 'active');
  const endedSessions = chatSessions.filter(s => s.status === 'ended');
  const hasMultipleWaitingSessions = waitingSessions.length > 2;

  // Show loading state
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

  const currentStatus = effectiveStatus;

  // Helper function to format session display name
  const formatSessionName = (session: ChatSession) => {
    let sessionName = `Session #${session.session_number}`;
    
    if (session.user_first_name) {
      const lastInitial = session.user_last_name ? ` ${session.user_last_name.charAt(0)}.` : '';
      sessionName += ` - ${session.user_first_name}${lastInitial}`;
    }
    
    return sessionName;
  };

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
            {/* Proposal notifications indicator */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 text-sm bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{pendingCount} pending meeting proposal{pendingCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {hasNewResponses && (
              <div className="flex items-center gap-2 text-sm bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span>New responses!</span>
                <Button variant="ghost" size="sm" onClick={clearNewResponses}>
                  ×
                </Button>
              </div>
            )}

            {/* Chat History Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowChatHistory(true)}
              className="flex items-center gap-2"
            >
              <History size={16} />
              Chat History ({endedSessions.length})
            </Button>

            {/* Status Error Display */}
            {statusError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span>{statusError}</span>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  ×
                </Button>
              </div>
            )}

            {/* Status Selector with Error Handling */}
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <Select 
                  value={currentStatus} 
                  onValueChange={handleStatusChange}
                  disabled={statusLoading || !currentSpecialistId}
                >
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
                
                {statusLoading && (
                  <span className="text-xs text-primary mt-1">
                    Updating...
                  </span>
                )}
                
                {!currentSpecialistId && (
                  <span className="text-xs text-muted-foreground mt-1">
                    Loading specialist...
                  </span>
                )}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} disabled={hasActiveSessions}>
              <LogOut size={16} className="mr-2" />
              {hasActiveSessions ? 'Sessions Active' : 'Log Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {peerSpecialist && <div className="mb-6">
            <h2 className="text-xl font-fjalla font-bold text-foreground">
              {peerSpecialist.first_name} {peerSpecialist.last_name}
            </h2>
            <p className="text-muted-foreground font-source">Peer Support Specialist</p>
          </div>}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Active Sessions</h3>
              <p className="text-muted-foreground font-source">Current live chat sessions</p>
            </div>
            <Badge variant="default">{activeSessions.length}</Badge>
          </Card>
          
          <Card className={`flex items-center justify-between p-6 ${hasMultipleWaitingSessions ? 'bg-warning border-warning-foreground/20' : ''}`}>
            <div>
              <h3 className="text-lg font-fjalla font-bold">Waiting Sessions</h3>
              <p className="text-muted-foreground font-source">Users waiting for a response</p>
            </div>
            <Badge variant="secondary">{waitingSessions.length}</Badge>
          </Card>
          
          <Card className={`flex items-center justify-between p-6 ${pendingCount > 0 ? 'bg-yellow-50 border-yellow-200' : ''}`}>
            <div>
              <h3 className="text-lg font-fjalla font-bold">Meeting Proposals</h3>
              <p className="text-muted-foreground font-source">Awaiting user responses</p>
            </div>
            <Badge variant={pendingCount > 0 ? "secondary" : "outline"} className={pendingCount > 0 ? "bg-yellow-100 text-yellow-800" : ""}>
              {pendingCount}
            </Badge>
          </Card>
          
          <Card className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-fjalla font-bold">Completed Sessions</h3>
              <p className="text-muted-foreground font-source">Total sessions completed today</p>
            </div>
            <Badge variant="outline">{endedSessions.length}</Badge>
          </Card>
        </div>

        {/* Chat Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Unified Chat Sessions List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-fjalla font-bold">Chat Sessions</h2>
                <p className="text-sm text-muted-foreground">
                  Waiting sessions appear first. Click to claim unassigned sessions.
                </p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                {getSortedActiveSessions().length} active
              </Badge>
            </div>

            <div className="space-y-4">
              {getSortedActiveSessions().length > 0 ? getSortedActiveSessions().map(session => (
                <div 
                  key={session.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedChatSession?.id === session.id ? 'border-primary bg-primary/5' : 'border-border'
                  } ${isWaitingTooLong(session) ? 'bg-warning border-warning-foreground/20' : ''} ${
                    session.status === 'waiting' && !session.specialist_id ? 'bg-blue-50/50 border-blue-200' : ''
                  }`} 
                  onClick={() => handleChatClick(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="text-primary" size={16} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-fjalla font-bold">{formatSessionName(session)}</span>
                          <Badge 
                            variant={
                              session.status === 'active' ? 'default' : 
                              session.status === 'waiting' ? 'secondary' : 'outline'
                            }
                            className={
                              session.status === 'waiting' && !session.specialist_id ? 
                              'bg-blue-100 text-blue-800 border-blue-200' : ''
                            }
                          >
                            {session.status === 'waiting' && !session.specialist_id ? 'Available' : session.status}
                          </Badge>
                          {session.status === 'waiting' && !session.specialist_id && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Click to claim
                            </Badge>
                          )}
                          {/* Proposal indicators - only show if there are actual pending proposals for this session */}
                          {session.pending_proposals_count && session.pending_proposals_count > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-orange-700 border-orange-200">
                              <Calendar className="w-3 h-3 mr-1" />
                              {session.pending_proposals_count} pending
                            </Badge>
                          )}
                          {session.has_new_responses && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              New response
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-source">
                          Started {format(new Date(session.started_at), 'MMM d, h:mm a')}
                          {session.status === 'waiting' && !session.specialist_id && (
                            <span className="ml-2 text-blue-600">• Unassigned</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-source">No active chat sessions</p>
                  <p className="font-source text-sm mt-2">Waiting and active sessions will appear here</p>
                </div>
              )}
            </div>
          </Card>

          {/* Chat Window or Welcome */}
          <Card className="p-0 overflow-hidden">
            {selectedChatSession ? (
              <SpecialistChatWindow session={selectedChatSession} onClose={handleCloseChatWindow} />
            ) : (
              <div className="p-6 text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-fjalla font-bold mb-2">Select a Chat Session</h3>
                <p className="text-muted-foreground font-source">
                  Choose a chat session from the list to start helping users with their recovery journey.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Enhanced Calendar Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-fjalla font-bold">Your Schedule</h2>
          </div>
          {peerSpecialist && (
            <EnhancedSpecialistCalendar specialistId={peerSpecialist.id} />
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

      {/* Chat History Modal */}
      {showChatHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-fjalla font-bold">Chat History</h2>
                  <p className="text-sm text-muted-foreground">Completed chat sessions</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowChatHistory(false)}>
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {getSortedEndedSessions().length > 0 ? getSortedEndedSessions().map(session => (
                  <div 
                    key={session.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 border-border`}
                    onClick={() => {
                      setSelectedChatSession(session);
                      setShowChatHistory(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="text-muted-foreground" size={16} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-fjalla font-bold">{formatSessionName(session)}</span>
                            <Badge variant="outline">ended</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-source">
                            Started {format(new Date(session.started_at), 'MMM d, h:mm a')}
                            {session.ended_at && (
                              <span> • Ended {format(new Date(session.ended_at), 'MMM d, h:mm a')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-source">No completed sessions yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PeerSpecialistDashboard;
