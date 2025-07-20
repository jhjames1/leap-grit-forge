import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, MessageSquare, BarChart3, Settings, Activity, Clock, CheckCircle, User, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RobustSpecialistChatWindow from './RobustSpecialistChatWindow';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import SpecialistSettings from './SpecialistSettings';
import PeerPerformanceDashboard from './PeerPerformanceDashboard';
import SpecialistActivityLog from './SpecialistActivityLog';
import SpecialistStatusIndicator from './SpecialistStatusIndicator';
import ChatHistory from './ChatHistory';
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
}
const PeerSpecialistDashboard = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showEndChatMessage, setShowEndChatMessage] = useState(false);

  // Use refs to track component state and prevent stale closures
  const currentSessionsRef = useRef<ChatSession[]>([]);
  const selectedSessionRef = useRef<ChatSession | null>(null);
  const channelRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Keep refs synchronized with state
  useEffect(() => {
    currentSessionsRef.current = sessions;
  }, [sessions]);
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  // Get specialist ID on mount
  useEffect(() => {
    const getSpecialistId = async () => {
      if (!user) return;
      try {
        const {
          data,
          error
        } = await supabase.from('peer_specialists').select('id').eq('user_id', user.id).single();
        if (error) throw error;
        setSpecialistId(data.id);
      } catch (err) {
        logger.error('Failed to get specialist ID:', err);
      }
    };
    getSpecialistId();
  }, [user]);

  // Enhanced session update handler with better state synchronization
  const handleSessionUpdate = useCallback((updatedSession: ChatSession) => {
    logger.debug('Session update received:', updatedSession);

    // Update sessions list immediately
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session => session.id === updatedSession.id ? {
        ...session,
        ...updatedSession,
        updated_at: new Date().toISOString()
      } : session);

      // If session wasn't in the list and it's relevant to this specialist, add it
      if (!prevSessions.find(s => s.id === updatedSession.id)) {
        if (updatedSession.status === 'waiting' || updatedSession.specialist_id === specialistId) {
          updatedSessions.push(updatedSession);
        }
      }
      return updatedSessions.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    });

    // Update selected session if it matches
    setSelectedSession(prevSelected => {
      if (prevSelected && prevSelected.id === updatedSession.id) {
        const mergedSession = {
          ...prevSelected,
          ...updatedSession
        };
        logger.debug('Updated selected session:', mergedSession);
        return mergedSession;
      }
      return prevSelected;
    });

    // Show appropriate toasts for status changes
    if (updatedSession.status === 'active') {
      toast({
        title: "Session Activated",
        description: `Session #${updatedSession.session_number} is now active.`
      });
    } else if (updatedSession.status === 'ended') {
      // Remove ended sessions from the active list
      setSessions(prevSessions => prevSessions.filter(s => s.id !== updatedSession.id));

      // Close the chat window if it's the selected session and show popup
      if (selectedSessionRef.current?.id === updatedSession.id) {
        setSelectedSession(null);
        setShowEndChatMessage(true);

        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowEndChatMessage(false);
        }, 3000);
      }
    }
  }, [specialistId, toast]);
  const loadSessions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      logger.debug('Loading sessions for specialist');

      // Get waiting sessions (unassigned) 
      const {
        data: waitingSessions,
        error: waitingError
      } = await supabase.from('chat_sessions').select('*').eq('status', 'waiting').is('specialist_id', null).order('started_at', {
        ascending: false
      });
      if (waitingError) throw waitingError;

      // Get specialist's own active/ended sessions
      const {
        data: ownSessions,
        error: ownError
      } = await supabase.from('chat_sessions').select('*').eq('specialist_id', specialistId).in('status', ['active', 'ended']).order('started_at', {
        ascending: false
      }).limit(20);
      if (ownError) throw ownError;

      // Get user profiles for all sessions
      const allSessionData = [...(waitingSessions || []), ...(ownSessions || [])];
      const userIds = allSessionData.map(s => s.user_id);
      const {
        data: profiles
      } = await supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', userIds);

      // Combine sessions with profile data
      const allSessions = allSessionData.map(session => {
        const profile = profiles?.find(p => p.user_id === session.user_id);
        return {
          ...session,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name
        } as ChatSession;
      });

      // Sort by most recent activity
      const sortedSessions = allSessions.sort((a, b) => new Date(b.updated_at || b.started_at).getTime() - new Date(a.updated_at || a.started_at).getTime());
      setSessions(sortedSessions);
      logger.debug('Loaded sessions:', sortedSessions.length);
    } catch (err) {
      logger.error('Error loading sessions:', err);
      toast({
        title: "Error Loading Sessions",
        description: "Could not load chat sessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced real-time subscription with better session claiming handling
  const setupRealtimeSubscription = useCallback(() => {
    if (channelRef.current || !user || !specialistId) return;
    logger.debug('Setting up enhanced real-time subscription');
    setConnectionStatus('connecting');
    const channelName = `specialist-dashboard-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_sessions'
    }, async payload => {
      logger.debug('New session created via real-time:', payload);
      const newSession = payload.new as ChatSession;

      // Only show waiting sessions or sessions assigned to this specialist
      if (newSession.status === 'waiting' || newSession.specialist_id === specialistId) {
        // Get user details for the new session
        const {
          data: profile
        } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', newSession.user_id).single();
        const sessionWithProfile = {
          ...newSession,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name
        };
        setSessions(prev => {
          const exists = prev.find(s => s.id === newSession.id);
          if (!exists) {
            return [sessionWithProfile, ...prev];
          }
          return prev;
        });
      }
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions'
    }, async payload => {
      logger.debug('Session updated via real-time:', payload);
      const updatedSession = payload.new as ChatSession;

      // Get user details if not already present
      let sessionWithProfile = updatedSession;
      if (!updatedSession.user_first_name) {
        const {
          data: profile
        } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', updatedSession.user_id).single();
        sessionWithProfile = {
          ...updatedSession,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name
        };
      }

      // Handle session claiming - ensure immediate UI update
      if (updatedSession.specialist_id === specialistId && updatedSession.status === 'active') {
        logger.debug('Session claimed by this specialist, updating UI immediately');

        // Update sessions list
        setSessions(prev => prev.map(session => session.id === updatedSession.id ? sessionWithProfile : session));

        // Update selected session if it matches
        if (selectedSessionRef.current?.id === updatedSession.id) {
          setSelectedSession(sessionWithProfile);
        }
      } else {
        // Use the standard update handler
        handleSessionUpdate(sessionWithProfile);
      }

      // Remove sessions that are no longer relevant
      if (updatedSession.status === 'ended' || updatedSession.specialist_id && updatedSession.specialist_id !== specialistId) {
        setSessions(prev => prev.filter(s => {
          // Keep if it's our session or if it's a waiting session
          return s.specialist_id === specialistId || s.status === 'waiting' && !s.specialist_id;
        }));
      }
    }).subscribe(status => {
      logger.debug('Real-time subscription status:', status);
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnectionStatus('disconnected');
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
            setupRealtimeSubscription();
          }
        }, 5000);
      }
    });
    channelRef.current = channel;
  }, [user, specialistId, handleSessionUpdate]);

  // Cleanup real-time subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      logger.debug('Cleaning up real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, []);

  // Initialize dashboard
  useEffect(() => {
    if (!isInitializedRef.current && user && specialistId) {
      isInitializedRef.current = true;
      loadSessions();
      setupRealtimeSubscription();
    }
    return cleanupRealtimeSubscription;
  }, [user, specialistId, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    logger.debug('Manual refresh triggered');
    setRefreshCount(prev => prev + 1);
    await loadSessions();
    toast({
      title: "Refreshed",
      description: "Session list has been updated."
    });
  }, [loadSessions, toast]);

  // Session selection with better error handling
  const handleSessionSelect = useCallback((session: ChatSession) => {
    logger.debug('Selecting session:', session.id);
    setSelectedSession(session);
  }, []);

  // Enhanced session close handler
  const handleSessionClose = useCallback(() => {
    logger.debug('Closing selected session');
    setSelectedSession(null);
    // Refresh sessions to get latest state
    loadSessions();
  }, [loadSessions]);
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
  return <div className="h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Peer Support Dashboard</h1>
            {specialistId && <SpecialistStatusIndicator specialistId={specialistId} />}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Chat History Button */}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowChatHistory(true)}>
              <History className="w-4 h-4" />
              Chat History
            </Button>

            {/* Performance Modal */}
            <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Performance
                </Button>
              </DialogTrigger>
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
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Activity Log</DialogTitle>
                </DialogHeader>
                {specialistId && <SpecialistActivityLog isOpen={true} onClose={() => setShowActivityModal(false)} specialistId={specialistId} />}
              </DialogContent>
            </Dialog>

            {/* Settings Modal */}
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Specialist Settings</DialogTitle>
                </DialogHeader>
                {specialistId && <SpecialistSettings isOpen={true} onClose={() => setShowSettingsModal(false)} specialist={{
                id: specialistId
              } as any} onUpdateSpecialist={() => {}} />}
              </DialogContent>
            </Dialog>

            <Button onClick={handleRefresh} disabled={isLoading} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top Row - Chat Sessions and Active Chat */}
        <div className="flex h-1/2 border-b">
          {/* Left Panel - Chat Sessions List */}
          <div className="w-1/2 border-r bg-card flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Chat Sessions</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className={connectionStatus === 'connected' ? 'bg-green-600' : ''}>
                    {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                  </Badge>
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {sessions.length === 0 ? <Card className="p-4">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No active sessions</p>
                      <p className="text-xs mt-1">Waiting sessions will appear here</p>
                    </div>
                  </Card> : sessions.map(session => <Card key={session.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedSession(session)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={session.status === 'waiting' ? 'secondary' : session.status === 'active' ? 'default' : 'outline'} className={session.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : session.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                              {session.status === 'waiting' ? 'Waiting' : session.status === 'active' ? 'Active' : 'Ended'}
                            </Badge>
                            <span className="text-sm font-medium">#{session.session_number}</span>
                          </div>
                          
                          <p className="font-medium text-sm">
                            {session.user_first_name && session.user_last_name ? `${session.user_first_name} ${session.user_last_name.charAt(0)}.` : 'Anonymous User'}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(session.started_at), 'HH:mm')}
                            </div>
                            {session.status === 'ended' && session.ended_at && <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Ended {format(new Date(session.ended_at), 'HH:mm')}
                              </div>}
                          </div>
                        </div>
                      </div>
                      
                      {session.status === 'waiting' && <Button size="sm" className="w-full mt-1 h-7 text-xs" onClick={e => {
                    e.stopPropagation();
                    setSelectedSession(session);
                  }}>
                          Join Session
                        </Button>}
                    </CardContent>
                  </Card>)}
              </div>
          </ScrollArea>
        </div>

          {/* Right Panel - Active Chat Sessions */}
          <div className="w-1/2 bg-card">
            <Card className="h-full border-0 rounded-none">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg">Active Chat Session</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-5rem)]">
                {selectedSession ? <RobustSpecialistChatWindow session={selectedSession} onClose={() => setSelectedSession(null)} onSessionUpdate={handleSessionUpdate} /> : <div className="flex-1 flex items-center justify-center h-full bg-muted/20">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <h3 className="text-base font-medium mb-1">No Session Selected</h3>
                      <p className="text-sm">Select a session to start chatting</p>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Row - Calendar */}
        <div className="h-1/2 bg-card">
          <Card className="h-full border-0 rounded-none">
            
            <CardContent className="p-0 h-[calc(100%-5rem)] overflow-y-auto">
              {specialistId && <EnhancedSpecialistCalendar specialistId={specialistId} />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat History Modal */}
      {specialistId && <ChatHistory isOpen={showChatHistory} onClose={() => setShowChatHistory(false)} specialistId={specialistId} />}

      {/* End Chat Message Popup */}
      {showEndChatMessage && <div className="fixed top-4 right-4 z-50">
          <Card className="bg-card border shadow-lg max-w-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Chat Ended</p>
                  <p className="text-xs text-muted-foreground">
                    This chat has ended and has been moved to the chat history.
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2" onClick={() => setShowEndChatMessage(false)}>
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>}
    </div>;
};
export default PeerSpecialistDashboard;