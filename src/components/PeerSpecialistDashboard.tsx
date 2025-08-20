import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  User, 
  Timer, 
  BarChart3,
  Activity,
  Settings,
  LogOut,
  History,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useSpecialistSessions } from '@/hooks/useSpecialistSessions';
import { useProposalNotifications } from '@/hooks/useProposalNotifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatDistanceToNow } from 'date-fns';
import { WaitingSessionCard } from './WaitingSessionCard';
import { SessionSlot } from './SessionSlot';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';
import SpecialistTrainingDashboard from './SpecialistTrainingDashboard';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import SpecialistActivityLog from './SpecialistActivityLog';
import SpecialistSettings from './SpecialistSettings';
import ChatHistory from './ChatHistory';
import SpecialistStatusIndicator from './SpecialistStatusIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PeerPerformanceDashboard from './PeerPerformanceDashboard';
import { CheckCircle, TrendingUp } from 'lucide-react';

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
  last_activity?: string;
  created_at: string;
  updated_at: string;
  end_reason?: string;
}

const PeerSpecialistDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  // Changed from single selectedSession to array of up to 3 active sessions
  const [activeSessions, setActiveSessions] = useState<(ChatSession | null)[]>([null, null, null]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('sessions');
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);
  const [specialistProfile, setSpecialistProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use the new specialist sessions hook
  const { sessions, isLoading, error, realtimeStatus, refreshSessions } = useSpecialistSessions(specialistId);
  
  // Use proposal notifications to trigger session refresh when proposals are accepted
  const { hasNewResponses, clearNewResponses } = useProposalNotifications(specialistId || '');

  // Calculate session metrics
  const activeSessionCount = activeSessions.filter(s => s !== null).length;
  const waitingSessionsList = sessions.filter(s => s.status === 'waiting' && !s.specialist_id);
  const availableSlots = activeSessions.map(s => s === null);

  // Load completed sessions count for today
  const loadTodayStats = useCallback(async () => {
    if (!specialistId) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get completed sessions for today
      const { data: completedSessions, error: completedError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('specialist_id', specialistId)
        .eq('status', 'ended')
        .gte('ended_at', today.toISOString())
        .lt('ended_at', tomorrow.toISOString());

      if (completedError) throw completedError;
      setCompletedToday(completedSessions?.length || 0);

      // Calculate average response time from recent messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          created_at,
          sender_type,
          session_id,
          chat_sessions!inner(specialist_id)
        `)
        .eq('chat_sessions.specialist_id', specialistId)
        .gte('created_at', today.toISOString())
        .order('created_at');

      if (messagesError) throw messagesError;

      if (messages && messages.length > 0) {
        const responseTimes: number[] = [];
        
        // Group messages by session
        const sessionMessages = messages.reduce((acc, msg) => {
          if (!acc[msg.session_id]) acc[msg.session_id] = [];
          acc[msg.session_id].push(msg);
          return acc;
        }, {} as Record<string, typeof messages>);

        // Calculate response times for each session
        Object.values(sessionMessages).forEach(sessionMsgs => {
          for (let i = 0; i < sessionMsgs.length - 1; i++) {
            const currentMsg = sessionMsgs[i];
            const nextMsg = sessionMsgs[i + 1];
            
            if (currentMsg.sender_type === 'user' && nextMsg.sender_type === 'specialist') {
              const responseTime = new Date(nextMsg.created_at).getTime() - new Date(currentMsg.created_at).getTime();
              responseTimes.push(responseTime / 1000); // Convert to seconds
            }
          }
        });

        if (responseTimes.length > 0) {
          const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
          setAvgResponseTime(Math.round(avgTime));
        }
      }
    } catch (error) {
      logger.error('Error loading today stats:', error);
    }
  }, [specialistId]);

  // Get specialist ID and profile on mount
  useEffect(() => {
    const getSpecialistProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('peer_specialists')
          .select(`
            id, 
            first_name, 
            last_name, 
            bio,
            specialties, 
            years_experience,
            avatar_url,
            is_active,
            is_verified
          `)
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        
        // Also fetch current status
        const { data: statusData } = await supabase
          .from('specialist_status')
          .select('status, status_message, last_seen, updated_at')
          .eq('specialist_id', data.id)
          .single();
        
        const fullProfile = {
          ...data,
          status: statusData || {
            status: 'offline',
            status_message: '',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        
        setSpecialistId(data.id);
        setSpecialistProfile(fullProfile);
        
        logger.debug('Loaded specialist profile with status:', fullProfile);
      } catch (err) {
        logger.error('Failed to get specialist profile:', err);
      }
    };
    getSpecialistProfile();
  }, [user]);

  // Load today's stats when specialist ID changes
  useEffect(() => {
    if (specialistId) {
      loadTodayStats();
    }
  }, [specialistId, loadTodayStats]);

  // Refresh sessions when proposal responses are received
  useEffect(() => {
    if (hasNewResponses) {
      logger.debug('Proposal response received, refreshing sessions');
      refreshSessions();
      clearNewResponses();
    }
  }, [hasNewResponses, refreshSessions, clearNewResponses]);

  // Session claiming logic - automatically assigns to next available slot
  const claimSession = useCallback(async (sessionId: string) => {
    // Find the next available slot
    const nextAvailableSlot = activeSessions.findIndex(session => session === null);
    
    if (nextAvailableSlot === -1) {
      toast({
        title: "All Slots Occupied",
        description: "All session slots are currently occupied. Please end a session first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Claim the session using the existing claim function
      const { data, error } = await supabase.rpc('claim_chat_session', {
        p_session_id: sessionId,
        p_specialist_user_id: user?.id
      });

      if (error) throw error;

      if ((data as any).success) {
        const session = (data as any).session;
        setActiveSessions(prev => {
          const newSessions = [...prev];
          newSessions[nextAvailableSlot] = session;
          return newSessions;
        });

        // Refresh sessions to update the waiting list
        refreshSessions();
      } else {
        throw new Error((data as any).error || 'Failed to claim session');
      }
    } catch (error) {
      logger.error('Error claiming session:', error);
      toast({
        title: "Error",
        description: "Failed to claim session. Please try again.",
        variant: "destructive"
      });
    }
  }, [activeSessions, user?.id, toast, refreshSessions]);

  // End session from specific slot
  const endSessionFromSlot = useCallback(async (sessionId: string, slotIndex: number) => {
    try {
      // End the session using the existing function
      const { data, error } = await supabase.rpc('end_chat_session_atomic', {
        p_session_id: sessionId,
        p_user_id: user?.id,
        p_end_reason: 'manual'
      });

      if (error) throw error;

      if ((data as any).success) {
        // Remove session from the slot
        setActiveSessions(prev => {
          const newSessions = [...prev];
          newSessions[slotIndex] = null;
          return newSessions;
        });

        toast({
          title: "Session Ended",
          description: `Session from Slot ${slotIndex + 1} has been ended.`
        });

        // Refresh sessions and stats
        refreshSessions();
        loadTodayStats();
      } else {
        throw new Error((data as any).error_message || 'Failed to end session');
      }
    } catch (error) {
      logger.error('Error ending session from slot:', error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive"
      });
    }
  }, [user?.id, toast, refreshSessions, loadTodayStats]);

  // Enhanced session update handler for multi-session support
  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    logger.debug('Session update received:', {
      sessionId: updatedSession.id,
      status: updatedSession.status,
      endReason: updatedSession.end_reason
    });

    // Update session in active sessions if it exists in any slot
    setActiveSessions(prev => {
      const newSessions = [...prev];
      const slotIndex = newSessions.findIndex(s => s?.id === updatedSession.id);
      
      if (slotIndex !== -1) {
        if (updatedSession.status === 'ended') {
          newSessions[slotIndex] = null;
        } else {
          newSessions[slotIndex] = { ...newSessions[slotIndex]!, ...updatedSession };
        }
      }
      
      return newSessions;
    });

    // Handle different session status changes without the activation popup
    if (updatedSession.status === 'ended') {
      const isTimeout = updatedSession.end_reason === 'auto_timeout' || updatedSession.end_reason === 'inactivity_timeout';
      
      if (isTimeout) {
        toast({
          title: "Session Timed Out",
          description: `Session #${updatedSession.session_number} has been automatically ended due to inactivity.`,
          variant: "destructive"
        });
      }

      // Refresh sessions list to remove ended session after a delay
      setTimeout(() => {
        logger.debug('Refreshing sessions after session end:', {
          sessionId: updatedSession.id,
          isTimeout
        });
        refreshSessions();
      }, isTimeout ? 5000 : 3000);

      // Refresh today's stats when a session ends
      loadTodayStats();
    }
  }, [toast, loadTodayStats, refreshSessions]);

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.debug('Manual refresh triggered');
    await refreshSessions();
    await loadTodayStats();
    toast({
      title: "Refreshed",
      description: "Session list has been updated."
    });
    setRefreshing(false);
  }, [refreshSessions, loadTodayStats, toast]);

  // Update specialist status based on active session count
  useEffect(() => {
    const updateSpecialistStatus = async () => {
      if (!specialistId) return;

      const currentActiveCount = activeSessionCount;
      let newStatus = 'online';
      let statusMessage = 'Available';

      if (currentActiveCount >= 3) {
        newStatus = 'busy';
        statusMessage = 'All slots occupied';
      } else if (currentActiveCount > 0) {
        newStatus = 'online';
        statusMessage = `Handling ${currentActiveCount}/3 sessions`;
      }

      try {
        await supabase
          .from('specialist_status')
          .upsert({
            specialist_id: specialistId,
            status: newStatus,
            status_message: statusMessage,
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        logger.error('Error updating specialist status:', error);
      }
    };

    updateSpecialistStatus();
  }, [activeSessionCount, specialistId]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatResponseTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Calculate wait time for a session in seconds
  const getWaitTimeSeconds = (session: ChatSession) => {
    return Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
  };

  // Get the longest waiting session
  const getLongestWaitingSession = () => {
    const waitingSessions = sessions.filter(s => s.status === 'waiting' && !s.specialist_id);
    if (waitingSessions.length === 0) return null;
    
    return waitingSessions.reduce((longest, current) => {
      const currentWait = getWaitTimeSeconds(current);
      const longestWait = getWaitTimeSeconds(longest);
      return currentWait > longestWait ? current : longest;
    });
  };

  // Check if any waiting session has been waiting longer than 45 seconds
  const hasUrgentWaitingSessions = () => {
    return sessions.some(s => s.status === 'waiting' && !s.specialist_id && getWaitTimeSeconds(s) > 45);
  };

  // Get appropriate card background class based on chat states
  const getActiveChatsCardClass = () => {
    return activeSessionCount > 0 ? 'bg-chat-active' : '';
  };

  const getWaitingChatsCardClass = () => {
    if (waitingSessionsList.length === 0) return '';
    if (hasUrgentWaitingSessions()) return 'bg-chat-urgent';
    return 'bg-chat-waiting';
  };

  // Generate stable motivational message based on specialist's ID to prevent constant changes
  const getMotivationalMessage = () => {
    if (!specialistProfile) return "Welcome to the Peer Support Specialist Dashboard";
    
    const messages = [
      "Your compassion transforms lives. Every conversation matters.",
      "Through your shared experience, you bring hope to those who need it most.",
      "Your journey empowers others to find their own path to recovery.",
      "You are making a difference, one conversation at a time.",
      "Your expertise and empathy create safe spaces for healing.",
      "Thank you for being a beacon of hope in someone's recovery journey."
    ];
    
    // Use specialist ID to generate a stable "random" index that doesn't change on re-renders
    const stableIndex = specialistProfile.id ? 
      specialistProfile.id.charCodeAt(0) % messages.length : 0;
    return messages[stableIndex];
  };

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Sessions",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col w-full">
        {/* Header with tabs */}
        <div className="border-b bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">
                  Peer Support Dashboard
                </h1>
                {specialistId && <SpecialistStatusIndicator specialistId={specialistId} />}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowChatHistory(true)}>
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPerformanceModal(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowActivityModal(true)}>
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
            
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sessions" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat Sessions
                  {(activeSessionCount > 0 || waitingSessionsList.length > 0) && (
                    <Badge variant="secondary" className="ml-1">
                      {activeSessionCount + waitingSessionsList.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="training" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Training
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="sessions" className="mt-4 space-y-4">
                {/* Welcome Message */}
                {specialistProfile && (
                  <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 text-primary" />
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">
                            Welcome, {specialistProfile.first_name} {specialistProfile.last_name}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getMotivationalMessage()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Active Chats Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className={getActiveChatsCardClass()}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Active Chats</p>
                              <p className="text-2xl font-bold text-chat-active-foreground">{activeSessionCount}</p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-chat-active-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of chat sessions you are currently handling</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Waiting Chats Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className={getWaitingChatsCardClass()}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Waiting Chats</p>
                              <p className="text-2xl font-bold text-chat-waiting-foreground">{waitingSessionsList.length}</p>
                              {hasUrgentWaitingSessions() && (
                                <p className="text-xs text-chat-urgent-foreground font-medium mt-1">
                                  Longest wait: {Math.floor(getWaitTimeSeconds(getLongestWaitingSession()!) / 60)}m {getWaitTimeSeconds(getLongestWaitingSession()!) % 60}s
                                </p>
                              )}
                            </div>
                            <Clock className={`h-8 w-8 ${hasUrgentWaitingSessions() ? 'text-chat-urgent-foreground' : 'text-chat-waiting-foreground'}`} />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Users waiting for support. Long waits (45+ seconds) are highlighted in red.</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Completed Today Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                              <p className="text-2xl font-bold text-blue-600">{completedToday}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of chat sessions completed today</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Average Response Time Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Ave. Response Time Today</p>
                              <p className="text-2xl font-bold text-purple-600">{formatResponseTime(avgResponseTime)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average time to respond to user messages today</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Waiting Sessions - Horizontal Row */}
                <Card>
                  <CardHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Waiting Sessions</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={realtimeStatus === 'connected' ? 'default' : 'secondary'} className={realtimeStatus === 'connected' ? 'bg-green-600' : ''}>
                          {realtimeStatus === 'connected' ? 'Connected' : realtimeStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                        </Badge>
                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {waitingSessionsList.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No users waiting for support</p>
                      </div>
                    ) : (
                      <ScrollArea className="w-full">
                        <div className="flex gap-4 pb-2">
                          {waitingSessionsList.map(session => (
                            <WaitingSessionCard
                              key={session.id}
                              session={session}
                              onClaim={() => claimSession(session.id)}
                              hasAvailableSlots={availableSlots.some(available => available)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Active Sessions - 3-Column Grid */}
                <Card>
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-lg">Active Chat Sessions ({activeSessionCount}/3)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
                      {[0, 1, 2].map(slotIndex => (
                        <SessionSlot
                          key={slotIndex}
                          session={activeSessions[slotIndex]}
                          slotIndex={slotIndex}
                          onEndSession={(sessionId) => endSessionFromSlot(sessionId, slotIndex)}
                          onSessionUpdate={handleSessionUpdate}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="mt-4">
                {specialistId && (
                  <EnhancedSpecialistCalendar specialistId={specialistId} />
                )}
              </TabsContent>

              <TabsContent value="training" className="mt-4">
                {specialistId && (
                  <SpecialistTrainingDashboard specialistId={specialistId} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Modals */}
        <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Performance Metrics</DialogTitle>
            </DialogHeader>
            {specialistId && <SpecialistPerformanceMetrics specialistId={specialistId} />}
          </DialogContent>
        </Dialog>

        {specialistId && (
          <>
            <SpecialistActivityLog
              isOpen={showActivityModal}
              onClose={() => setShowActivityModal(false)}
              specialistId={specialistId}
            />
            <SpecialistSettings
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              specialist={specialistProfile}
              onUpdateSpecialist={setSpecialistProfile}
            />
          </>
        )}

        {/* Chat History Modal */}
        {specialistId && (
          <ChatHistory
            isOpen={showChatHistory}
            onClose={() => setShowChatHistory(false)}
            specialistId={specialistId}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default PeerSpecialistDashboard;