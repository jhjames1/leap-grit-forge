import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSpecialistSessions } from '@/hooks/useSpecialistSessions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, MessageSquare, BarChart3, UserCircle, Activity, Clock, CheckCircle, User, History, TrendingUp, LogOut, GraduationCap, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RobustSpecialistChatWindow from './RobustSpecialistChatWindow';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import SpecialistSettings from './SpecialistSettings';
import PeerPerformanceDashboard from './PeerPerformanceDashboard';
import SpecialistActivityLog from './SpecialistActivityLog';
import SpecialistStatusIndicator from './SpecialistStatusIndicator';
import ChatHistory from './ChatHistory';
import SpecialistTrainingDashboard from './SpecialistTrainingDashboard';
import { SpecialistSidebar } from './SpecialistSidebar';
import { SpecialistSidebarToast } from './SpecialistSidebarToast';
import { WaitingSessionCard } from './WaitingSessionCard';
import { SessionSlot } from './SessionSlot';
import { useProposalNotifications } from '@/hooks/useProposalNotifications';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';

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
  const [showEndChatMessage, setShowEndChatMessage] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);
  const [specialistProfile, setSpecialistProfile] = useState<any>(null);

  // Use the new specialist sessions hook
  const { sessions, isLoading, error, realtimeStatus, refreshSessions } = useSpecialistSessions(specialistId);
  
  // Use proposal notifications to trigger session refresh when proposals are accepted
  const { hasNewResponses, clearNewResponses } = useProposalNotifications(specialistId || '');

  // Keep refs synchronized with state - now tracking active sessions array
  const activeSessionsRef = useRef<(ChatSession | null)[]>([null, null, null]);
  useEffect(() => {
    activeSessionsRef.current = activeSessions;
  }, [activeSessions]);

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

        toast({
          title: "Session Claimed",
          description: `Session #${session.session_number} claimed to Slot ${nextAvailableSlot + 1}.`
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

        setShowEndChatMessage(true);
        toast({
          title: "Session Ended",
          description: `Session from Slot ${slotIndex + 1} has been ended.`
        });

        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowEndChatMessage(false);
        }, 3000);

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

    // Handle different session status changes
    if (updatedSession.status === 'active') {
      toast({
        title: "Session Activated",
        description: `Session #${updatedSession.session_number} is now active.`
      });
    } else if (updatedSession.status === 'ended') {
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
    logger.debug('Manual refresh triggered');
    await refreshSessions();
    await loadTodayStats();
    toast({
      title: "Refreshed",
      description: "Session list has been updated."
    });
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

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'waiting':
        return 'bg-yellow-500';
      case 'ended':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getSessionStatusText = (session: ChatSession) => {
    if (session.status === 'waiting') {
      return 'Available';
    }
    return session.status;
  };

  const formatSessionName = (session: ChatSession) => {
    let name = `Session #${session.session_number}`;
    if (session.user_first_name) {
      const lastInitial = session.user_last_name ? ` ${session.user_last_name.charAt(0)}.` : '';
      name += ` - ${session.user_first_name}${lastInitial}`;
    }
    return name;
  };

  const getSessionAge = (session: ChatSession) => {
    const age = Date.now() - new Date(session.started_at).getTime();
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return minutes < 1 ? 'just now' : `${minutes}m ago`;
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
        <SpecialistSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
          onOpenChatHistory={() => setShowChatHistory(true)}
          onOpenPerformance={() => setShowPerformanceModal(true)}
          onOpenActivity={() => setShowActivityModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          activeSessions={activeSessionCount}
          waitingSessions={waitingSessionsList.length}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <div className="border-b bg-card h-16 flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">
                {activeSection === 'sessions' && 'Chat Sessions'}
                {activeSection === 'calendar' && 'Calendar'}
                {activeSection === 'training' && 'Training Dashboard'}
              </h1>
              {specialistId && <SpecialistStatusIndicator specialistId={specialistId} />}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {activeSection === 'sessions' && (
              <>
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
              </>
            )}

            {activeSection === 'calendar' && (
              <Card className="w-full">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg">Schedule & Calendar</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {specialistId && <EnhancedSpecialistCalendar specialistId={specialistId} />}
                </CardContent>
              </Card>
            )}

            {activeSection === 'training' && specialistId && (
              <SpecialistTrainingDashboard specialistId={specialistId} />
            )}
          </div>
        </div>

        {/* Performance Modal */}
        <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Performance Metrics</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {specialistId && <SpecialistPerformanceMetrics specialistId={specialistId} />}
              <PeerPerformanceDashboard onRefresh={handleRefresh} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Activity Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Log</DialogTitle>
            </DialogHeader>
            {specialistId && <SpecialistActivityLog isOpen={true} onClose={() => setShowActivityModal(false)} specialistId={specialistId} />}
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        {specialistProfile && (
          <SpecialistSettings 
            isOpen={showSettingsModal} 
            onClose={() => setShowSettingsModal(false)} 
            specialist={specialistProfile} 
            onUpdateSpecialist={(updatedSpecialist) => {
              logger.debug('Specialist profile updated in settings:', updatedSpecialist);
              setSpecialistProfile(updatedSpecialist);
              // Refresh data to ensure UI is synchronized
              loadTodayStats();
              toast({
                title: "Profile Updated",
                description: "Your specialist profile has been updated successfully."
              });
            }}
          />
        )}

        {/* Chat History Modal */}
        {specialistId && (
          <ChatHistory
            isOpen={showChatHistory}
            onClose={() => setShowChatHistory(false)}
            specialistId={specialistId}
          />
        )}

        {/* End Chat Message Popup */}
        {showEndChatMessage && (
          <div className="fixed top-4 right-4 z-50">
            <Card className="bg-card border shadow-lg max-w-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Chat Ended</p>
                    <p className="text-xs text-muted-foreground">
                      This chat has ended and has been moved to the chat history.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={() => setShowEndChatMessage(false)}
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Specialist Sidebar Toast Notifications */}
        <SpecialistSidebarToast />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default PeerSpecialistDashboard;
