import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, MessageSquare, Calendar, BarChart3, Settings, Users, Phone, Video, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import RobustSpecialistChatWindow from './RobustSpecialistChatWindow';
import EnhancedSpecialistCalendar from './calendar/EnhancedSpecialistCalendar';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import SpecialistSettings from './SpecialistSettings';
import PeerPerformanceDashboard from './PeerPerformanceDashboard';
import SpecialistActivityLog from './SpecialistActivityLog';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

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
        const { data, error } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
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
      const updatedSessions = prevSessions.map(session => 
        session.id === updatedSession.id 
          ? { ...session, ...updatedSession, updated_at: new Date().toISOString() }
          : session
      );
      
      // If session wasn't in the list and it's relevant to this specialist, add it
      if (!prevSessions.find(s => s.id === updatedSession.id)) {
        if (updatedSession.status === 'waiting' || 
            (updatedSession.specialist_id === specialistId)) {
          updatedSessions.push(updatedSession);
        }
      }
      
      return updatedSessions.sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - 
        new Date(a.updated_at || a.created_at).getTime()
      );
    });

    // Update selected session if it matches
    setSelectedSession(prevSelected => {
      if (prevSelected && prevSelected.id === updatedSession.id) {
        const mergedSession = { ...prevSelected, ...updatedSession };
        logger.debug('Updated selected session:', mergedSession);
        return mergedSession;
      }
      return prevSelected;
    });

    // Show appropriate toasts for status changes
    if (updatedSession.status === 'active') {
      toast({
        title: "Session Activated",
        description: `Session #${updatedSession.session_number} is now active.`,
      });
    } else if (updatedSession.status === 'ended') {
      toast({
        title: "Session Ended",
        description: `Session #${updatedSession.session_number} has ended.`,
      });
      
      // Close the chat window if it's the selected session
      if (selectedSessionRef.current?.id === updatedSession.id) {
        setSelectedSession(null);
      }
    }
  }, [specialistId, toast]);

  const loadSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      logger.debug('Loading sessions for specialist');
      
      // Get waiting sessions (unassigned) 
      const { data: waitingSessions, error: waitingError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'waiting')
        .is('specialist_id', null)
        .order('started_at', { ascending: false });

      if (waitingError) throw waitingError;

      // Get specialist's own active/ended sessions
      const { data: ownSessions, error: ownError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialistId)
        .in('status', ['active', 'ended'])
        .order('started_at', { ascending: false })
        .limit(20);

      if (ownError) throw ownError;

      // Get user profiles for all sessions
      const allSessionData = [...(waitingSessions || []), ...(ownSessions || [])];
      const userIds = allSessionData.map(s => s.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

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
      const sortedSessions = allSessions.sort((a, b) => 
        new Date(b.updated_at || b.started_at).getTime() - 
        new Date(a.updated_at || a.started_at).getTime()
      );

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

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions'
        },
        async (payload) => {
          logger.debug('New session created via real-time:', payload);
          const newSession = payload.new as ChatSession;
          
          // Only show waiting sessions or sessions assigned to this specialist
          if (newSession.status === 'waiting' || newSession.specialist_id === specialistId) {
            // Get user details for the new session
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', newSession.user_id)
              .single();

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
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions'
        },
        async (payload) => {
          logger.debug('Session updated via real-time:', payload);
          const updatedSession = payload.new as ChatSession;
          
          // Get user details if not already present
          let sessionWithProfile = updatedSession;
          if (!updatedSession.user_first_name) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', updatedSession.user_id)
              .single();

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
            setSessions(prev => 
              prev.map(session => 
                session.id === updatedSession.id 
                  ? sessionWithProfile
                  : session
              )
            );

            // Update selected session if it matches
            if (selectedSessionRef.current?.id === updatedSession.id) {
              setSelectedSession(sessionWithProfile);
            }
          } else {
            // Use the standard update handler
            handleSessionUpdate(sessionWithProfile);
          }

          // Remove sessions that are no longer relevant
          if (updatedSession.status === 'ended' || 
              (updatedSession.specialist_id && updatedSession.specialist_id !== specialistId)) {
            setSessions(prev => prev.filter(s => {
              // Keep if it's our session or if it's a waiting session
              return s.specialist_id === specialistId || 
                     (s.status === 'waiting' && !s.specialist_id);
            }));
          }
        }
      )
      .subscribe((status) => {
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
      description: "Session list has been updated.",
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
      case 'active': return 'bg-green-500';
      case 'waiting': return 'bg-yellow-500';
      case 'ended': return 'bg-gray-400';
      default: return 'bg-gray-400';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Peer Support Specialist Portal</h1>
            <p className="text-muted-foreground">Manage your sessions and support activities</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-sm text-muted-foreground capitalize">{connectionStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sessions">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Users className="w-4 h-4 mr-2" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Active Chat Sessions</h2>
                  <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {sessions.length > 0 ? (
                      sessions.map((session) => (
                        <Card
                          key={session.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleSessionSelect(session)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <User className="text-muted-foreground" size={16} />
                                </div>
                                <div>
                                  <h3 className="font-medium">{formatSessionName(session)}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Started {getSessionAge(session)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getSessionStatusColor(session.status)}`} />
                                <Badge variant={session.status === 'waiting' ? 'secondary' : 'default'}>
                                  {getSessionStatusText(session)}
                                </Badge>
                              </div>
                            </div>
                            
                            {session.last_activity && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Last activity: {format(new Date(session.last_activity), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-2">No Active Sessions</h3>
                          <p className="text-muted-foreground text-sm">
                            {isLoading ? 'Loading sessions...' : 'New chat sessions will appear here when users start conversations.'}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="calendar">
                {specialistId && <EnhancedSpecialistCalendar specialistId={specialistId} />}
              </TabsContent>

              <TabsContent value="metrics">
                <div className="space-y-6">
                  {specialistId && <SpecialistPerformanceMetrics specialistId={specialistId} />}
                  <PeerPerformanceDashboard onRefresh={handleRefresh} />
                </div>
              </TabsContent>

              <TabsContent value="activity">
                {specialistId && <SpecialistActivityLog isOpen={true} onClose={() => {}} specialistId={specialistId} />}
              </TabsContent>

              <TabsContent value="settings">
                {specialistId && <SpecialistSettings 
                  isOpen={true} 
                  onClose={() => {}} 
                  specialist={{ id: specialistId } as any} 
                  onUpdateSpecialist={() => {}} 
                />}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            {selectedSession ? (
              <div className="sticky top-6">
                <RobustSpecialistChatWindow
                  session={selectedSession}
                  onClose={handleSessionClose}
                  onSessionUpdate={handleSessionUpdate}
                />
              </div>
            ) : (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Active Chat Window</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a chat session to start helping someone in need.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerSpecialistDashboard;
