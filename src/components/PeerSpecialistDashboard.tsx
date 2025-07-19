import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Calendar, Users, Clock, CheckCircle, AlertCircle, ChevronRight, User, LogOut, Settings, CalendarClock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import SpecialistChatWindow from './SpecialistChatWindow';
import SpecialistCalendar from './calendar/SpecialistCalendar';
import ScheduleManagementModal from './calendar/ScheduleManagementModal';
import { useToast } from '@/hooks/use-toast';
import { useCalendarAwarePresence } from '@/hooks/useCalendarAwarePresence';
import { logger } from '@/utils/logger';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatFilter, setChatFilter] = useState<'all' | 'waiting' | 'active'>('all');
  const [peerSpecialist, setPeerSpecialist] = useState<PeerSpecialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Performance monitoring ref
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  // Increment render count for debugging
  renderCount.current += 1;
  logger.debug(`PeerSpecialistDashboard render`, { 
    renderCount: renderCount.current, 
    mountedTime: Date.now() - mountTime.current 
  });

  // Use the calendar-aware presence hook
  const {
    calendarAvailability,
    manualStatusOverride,
    isCalendarControlled,
    setManualStatus,
    toggleCalendarControl,
    refreshAvailability,
    specialistId,
    getEffectiveStatus,
    getStatusMessage
  } = useCalendarAwarePresence();

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

        // Load chat sessions with the specialist ID
        await loadChatSessionsForSpecialist(specialistWithUserData.id);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadChatSessionsForSpecialist = useCallback(async (specialistId: string) => {
    logger.debug('Loading chat sessions for specialist', { specialistId });
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('specialist_id', specialistId)
      .order('started_at', { ascending: false });

    if (error) {
      logger.error('Error fetching chat sessions', error);
    } else {
      logger.debug('Loaded chat sessions', { count: data?.length || 0 });
      const typedSessions = (data || []).map(session => ({
        ...session,
        status: session.status as 'waiting' | 'active' | 'ended'
      }));
      setChatSessions(typedSessions);
    }
  }, []);

  const loadChatSessions = useCallback(async () => {
    if (!peerSpecialist) return;
    await loadChatSessionsForSpecialist(peerSpecialist.id);
  }, [peerSpecialist?.id, loadChatSessionsForSpecialist]);

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
        loadChatSessions();
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
        loadChatSessions();
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
        loadChatSessions();
      })
      .subscribe();

    // Subscribe to specialist status changes
    const statusChannel = supabase
      .channel(`specialist-status-realtime-${specialistId || 'unknown'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'specialist_status',
        filter: specialistId ? `specialist_id=eq.${specialistId}` : undefined
      }, payload => {
        logger.debug('Real-time status change', payload);
        if (refreshAvailability) {
          setTimeout(refreshAvailability, 100);
        }
      })
      .subscribe();

    return () => {
      logger.debug('Cleaning up real-time subscriptions');
      supabase.removeChannel(chatSessionsChannel);
      supabase.removeChannel(appointmentProposalsChannel);
      supabase.removeChannel(chatMessagesChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [user?.id, specialistId, refreshAvailability, loadChatSessions]);

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
    loadChatSessions();
  };

  // Enhanced status change handler with detailed error handling
  const handleStatusChange = async (newStatus: 'online' | 'away' | 'offline') => {
    if (!specialistId) {
      const errorMsg = 'No specialist ID available';
      logger.error(errorMsg);
      setStatusError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      const errorMsg = 'User not authenticated';
      logger.error(errorMsg);
      setStatusError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setStatusLoading(true);
    setStatusError(null);
    logger.debug('Changing status', { newStatus, specialistId, userId: user.id });
    
    try {
      await setManualStatus(newStatus, `Manually set to ${newStatus}`);
      
      toast({
        title: "Status Updated",
        description: `Your status has been changed to ${newStatus}`,
      });
      
      logger.debug('Status change successful', { newStatus });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating status', { error: errorMessage, newStatus });
      setStatusError(errorMessage);
      
      toast({
        title: "Status Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setStatusLoading(false);
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
      if (specialistId) {
        await supabase
          .from('specialist_status')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString()
          })
          .eq('specialist_id', specialistId);
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

  // Check if there are more than 2 users waiting
  const waitingSessions = chatSessions.filter(s => s.status === 'waiting');
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

  const currentStatus = getEffectiveStatus();
  const statusMessage = getStatusMessage();

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
            {/* Calendar Control Toggle with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <Switch
                      checked={isCalendarControlled}
                      onCheckedChange={toggleCalendarControl}
                      className="data-[state=checked]:bg-primary"
                      disabled={statusLoading}
                    />
                    <span className="text-sm text-muted-foreground">Auto</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Calendar-Based Status Control</p>
                    <p className="text-sm">When enabled, your status is automatically set based on your calendar:</p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Online</strong> during working hours</li>
                      <li>• <strong>Busy</strong> during appointments</li>
                      <li>• <strong>Offline</strong> outside working hours</li>
                    </ul>
                    <p className="text-sm">When disabled, you can manually control your status.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Status Selector with Error Handling */}
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <Select 
                  value={currentStatus} 
                  onValueChange={handleStatusChange}
                  disabled={statusLoading || !specialistId}
                >
                  <SelectTrigger className={`w-32 bg-background border-border z-50 ${
                    statusError ? 'border-destructive' : ''
                  }`}>
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
                
                {/* Status Message or Error */}
                {statusError ? (
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="truncate">{statusError}</span>
                  </div>
                ) : statusMessage ? (
                  <span className="text-xs text-muted-foreground mt-1 truncate">
                    {statusMessage}
                  </span>
                ) : null}
                
                {statusLoading && (
                  <span className="text-xs text-primary mt-1">
                    Updating...
                  </span>
                )}
                
                {!specialistId && (
                  <span className="text-xs text-muted-foreground mt-1">
                    Loading specialist...
                  </span>
                )}
              </div>
            </div>

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

        {/* Calendar Availability Info */}
        {calendarAvailability && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Calendar Status: {calendarAvailability.isAvailable ? 'Available' : 'Not Available'}
                </span>
                {calendarAvailability.reason && (
                  <span className="text-sm text-muted-foreground">- {calendarAvailability.reason}</span>
                )}
              </div>
              {calendarAvailability.nextAvailable && (
                <span className="text-sm text-muted-foreground">
                  Next available: {format(calendarAvailability.nextAvailable, 'MMM d, h:mm a')}
                </span>
              )}
            </div>
          </div>
        )}
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
              {filterSessions().length > 0 ? filterSessions().map(session => (
                <div 
                  key={session.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedChatSession?.id === session.id ? 'border-primary bg-primary/5' : 'border-border'
                  } ${isWaitingTooLong(session) ? 'bg-warning border-warning-foreground/20' : ''}`} 
                  onClick={() => handleChatClick(session)}
                >
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
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-source">No {chatFilter !== 'all' ? chatFilter : ''} chat sessions</p>
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
