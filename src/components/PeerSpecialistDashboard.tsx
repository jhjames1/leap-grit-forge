import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { audioNotification } from '@/utils/audioNotification';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Bell, 
  LogOut, 
  Clock,
  User,
  Settings,
  Send,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatSession {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  lastMessage?: {
    content: string;
    sender_type: string;
    created_at: string;
  };
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

interface SpecialistStatus {
  id: string;
  specialist_id: string;
  status: 'online' | 'busy' | 'offline';
  status_message: string | null;
  last_seen: string;
}

interface PeerSpecialist {
  id: string;
  first_name: string;
  last_name: string;
  specialties: string[];
}

const PeerSpecialistDashboard = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [specialist, setSpecialist] = useState<PeerSpecialist | null>(null);
  const [specialistStatus, setSpecialistStatus] = useState<SpecialistStatus | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // Audio notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('specialist-notifications-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  

  useEffect(() => {
    if (user) {
      loadSpecialistData();
    }
  }, [user]);

  useEffect(() => {
    if (specialist) {
      loadChatSessions();
      setupRealtimeSubscriptions();
    }
  }, [specialist]);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSpecialistData = async () => {
    try {
      // Get specialist info
      const { data: specialistData, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (specialistError) throw specialistError;
      setSpecialist(specialistData);

      // Get or create specialist status
      const { data: statusData, error: statusError } = await supabase
        .from('specialist_status')
        .select('*')
        .eq('specialist_id', specialistData.id)
        .single();

      if (statusError && statusError.code === 'PGRST116') {
        // Create initial status if doesn't exist
        const { data: newStatus, error: createError } = await supabase
          .from('specialist_status')
          .insert({
            specialist_id: specialistData.id,
            status: 'offline',
            last_seen: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        setSpecialistStatus(newStatus as SpecialistStatus);
      } else if (statusError) {
        throw statusError;
      } else {
        setSpecialistStatus(statusData as SpecialistStatus);
      }
    } catch (error) {
      console.error('Error loading specialist data:', error);
      toast({
        title: "Error",
        description: "Failed to load specialist information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sortSessionsByPriority = (sessions: ChatSession[]) => {
    return sessions.sort((a, b) => {
      // Assign priority values: waiting = 1, active = 2, ended = 3
      const getStatusPriority = (status: string) => {
        switch (status) {
          case 'waiting': return 1;
          case 'active': return 2;
          case 'ended': return 3;
          default: return 4;
        }
      };

      const aPriority = getStatusPriority(a.status);
      const bPriority = getStatusPriority(b.status);

      // First sort by status priority (ascending: waiting first)
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Within same status, sort by created_at descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const loadChatSessions = async () => {
    if (!specialist) return;

    try {
      // First get all sessions for this specialist
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialist.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      console.log('Loaded chat sessions:', sessions);

      // For each session, get the most recent message
      const sessionsWithLastMessage = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('content, sender_type, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          console.log(`Session ${session.id} - Status: ${session.status}, Last message:`, lastMessage);

          return {
            ...session,
            lastMessage: lastMessage || undefined
          };
        })
      );

      // Sort sessions by priority before setting state
      const sortedSessions = sortSessionsByPriority(sessionsWithLastMessage);
      setChatSessions(sortedSessions);
      console.log('Sessions with last messages (sorted):', sortedSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    console.log('Loading messages for session:', sessionId);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Loaded messages:', data);
      setMessages(data || []);
      
      // Auto-scroll to bottom after loading messages
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!specialist) return;

    // Subscribe to new chat sessions
    const sessionChannel = supabase
      .channel('chat-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `specialist_id=eq.${specialist.id}`
        },
        (payload) => {
          const newSession = { ...payload.new as ChatSession, lastMessage: undefined };
          setChatSessions(prev => sortSessionsByPriority([newSession, ...prev]));
          toast({
            title: "New Chat Request",
            description: "A user wants to start a chat with you"
          });
        }
      )
      .subscribe();

    // Subscribe to ALL messages for this specialist's sessions to update last message info
    const allMessagesChannel = supabase
      .channel('all-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          console.log('🔥 New message received via realtime:', newMessage);
          console.log('🎯 Currently selected session:', selectedSession?.id);
          console.log('🎯 Message is for session:', newMessage.session_id);
          
          // Check if this message is for this specialist's sessions
          const isForThisSpecialist = chatSessions.some(session => session.id === newMessage.session_id);
          
          // Play notification sound for new user messages (not from specialist)
          if (isForThisSpecialist && 
              newMessage.sender_type === 'user' && 
              notificationsEnabled) {
            console.log('🔊 Playing notification sound for new user message');
            try {
              audioNotification.playTwoToneNotification();
            } catch (error) {
              console.log('Could not play notification sound:', error);
            }
          }
          
          // Update the last message in chat sessions for any session this specialist has
          setChatSessions(prev => sortSessionsByPriority(prev.map(session => 
            session.id === newMessage.session_id 
              ? { 
                  ...session, 
                  lastMessage: {
                    content: newMessage.content,
                    sender_type: newMessage.sender_type,
                    created_at: newMessage.created_at
                  }
                }
              : session
          )));

          // If this message is for the currently selected session, also update the messages
          if (selectedSession && newMessage.session_id === selectedSession.id) {
            console.log('✅ Adding message to current session messages');
            setMessages(prev => {
              console.log('Current messages before adding new one:', prev);
              const newMessages = [...prev, newMessage];
              console.log('Messages after adding new one:', newMessages);
              return newMessages;
            });
            
            // Auto-scroll to show new messages if viewing this session
            setTimeout(() => {
              const messagesContainer = document.getElementById('messages-container');
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            }, 100);
          } else {
            console.log('❌ Message not for current session, skipping message addition');
          }
        }
      )
      .subscribe();

    // Subscribe to session status updates
    const sessionUpdatesChannel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `specialist_id=eq.${specialist.id}`
        },
        (payload) => {
          const updatedSession = payload.new as ChatSession;
          setChatSessions(prev => sortSessionsByPriority(prev.map(session => 
            session.id === updatedSession.id 
              ? { ...session, ...updatedSession }
              : session
          )));

          if (selectedSession?.id === updatedSession.id) {
            setSelectedSession(updatedSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(allMessagesChannel);
      supabase.removeChannel(sessionUpdatesChannel);
    };
  };

  const updateStatus = async (newStatus: 'online' | 'busy' | 'offline', message?: string) => {
    if (!specialistStatus) return;

    try {
      const { error } = await supabase
        .from('specialist_status')
        .update({
          status: newStatus,
          status_message: message || null,
          last_seen: new Date().toISOString()
        })
        .eq('id', specialistStatus.id);

      if (error) throw error;

      setSpecialistStatus(prev => prev ? {
        ...prev,
        status: newStatus,
        status_message: message || null,
        last_seen: new Date().toISOString()
      } : null);

      toast({
        title: "Status Updated",
        description: `Your status has been changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const startPhoneCall = () => {
    if (selectedSession) {
      // In a real implementation, this would integrate with a calling service
      toast({
        title: "Phone Call",
        description: "Initiating phone call with user..."
      });
    }
  };

  const startVideoCall = () => {
    if (selectedSession) {
      // Open Zoom meeting
      const zoomUrl = `https://zoom.us/start/videomeeting`;
      window.open(zoomUrl, '_blank');
      toast({
        title: "Video Call",
        description: "Opening Zoom meeting..."
      });
    }
  };

  const handleSignOut = async () => {
    // Set status to offline before signing out
    if (specialistStatus) {
      await updateStatus('offline');
    }
    await signOut();
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'waiting': return 'bg-yellow-500 text-white';
      case 'ended': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'busy': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession.id,
          sender_id: user.id,
          sender_type: 'specialist',
          message_type: 'text',
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      
      // Update session to active if it was waiting
      if (selectedSession.status === 'waiting') {
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({ status: 'active' })
          .eq('id', selectedSession.id);

        if (!updateError) {
          setSelectedSession(prev => prev ? { ...prev, status: 'active' } : null);
          setChatSessions(prev => sortSessionsByPriority(prev.map(session => 
            session.id === selectedSession.id 
              ? { ...session, status: 'active' }
              : session
          )));
        }
      }

      toast({
        title: "Message Sent",
        description: "Your message has been delivered"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleEndChat = async (sessionId: string) => {
    if (!user) return;

    try {
      // Send a kind farewell message first
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          sender_type: 'specialist',
          message_type: 'text',
          content: "Thank you for reaching out today. Remember, you're not alone on this journey, and every step forward is a victory. Take care of yourself, and don't hesitate to reach out again if you need support. You've got this! 💪"
        });

      if (messageError) throw messageError;

      // Then end the session
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      setChatSessions(prev => sortSessionsByPriority(prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'ended', ended_at: new Date().toISOString() }
          : session
      )));

      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { 
          ...prev, 
          status: 'ended', 
          ended_at: new Date().toISOString() 
        } : null);
      }

      toast({
        title: "Chat Ended",
        description: "The chat session has been ended and a farewell message was sent"
      });
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Error",
        description: "Failed to end chat session",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="p-4 pb-24 bg-background min-h-screen flex items-center justify-center">
        <p className="text-steel-light">Loading dashboard...</p>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="p-4 pb-24 bg-background min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-fjalla text-foreground">Not Registered</h2>
            <p className="text-steel-light">
              You are not registered as a peer specialist. Please contact an administrator 
              to be added to the specialist program.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="default"
                className="w-full"
              >
                Return to Home
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-6">
            {/* Left column: Title and welcome text */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">PEER</span><span className="font-fjalla font-extrabold italic">SPECIALIST</span>
              </h1>
              <div className="mt-8"></div>
              <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
                WELCOME, <span className="font-bold italic">{specialist.first_name.toUpperCase()} {specialist.last_name.toUpperCase()}</span>
              </p>
              <p className="text-muted-foreground text-sm">Ready to help others on their journey</p>
              
              {/* Status Settings moved here */}
              {specialistStatus && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-source text-card-foreground">Current Status:</span>
                    <Badge className={getStatusColor(specialistStatus.status)}>
                      {specialistStatus.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-source text-card-foreground">Last Seen:</span>
                    <span className="text-muted-foreground text-sm">
                      {specialistStatus.last_seen ? new Date(specialistStatus.last_seen).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => setIsStatusDialogOpen(true)}
                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                  >
                    Update Status
                  </Button>
                  
                  {/* Notification Settings */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Bell size={16} className="text-muted-foreground" />
                      <span className="font-source text-card-foreground text-sm">Sound Notifications</span>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={(checked) => {
                        setNotificationsEnabled(checked);
                        localStorage.setItem('specialist-notifications-enabled', JSON.stringify(checked));
                        toast({
                          title: checked ? "Notifications Enabled" : "Notifications Disabled",
                          description: checked ? "You'll hear a sound when new messages arrive" : "Message notifications are now silent"
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Right column: Status */}
            <div className="flex flex-col items-end">
              {specialistStatus && (
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(specialistStatus.status)} cursor-pointer`}
                  onClick={() => setIsStatusDialogOpen(true)}
                >
                  {specialistStatus.status.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status and Overview Cards */}
        <div className="flex gap-4 mb-4">
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[50%]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-primary p-3 rounded-sm">
                <MessageSquare className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                Active Sessions
              </h3>
            </div>
            <div className="text-2xl font-bold text-card-foreground">
              {chatSessions.filter(s => s.status === 'active').length}
            </div>
          </Card>

          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 w-[50%]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-primary p-3 rounded-sm">
                <Clock className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                Waiting
              </h3>
            </div>
            <div className="text-2xl font-bold text-card-foreground">
              {chatSessions.filter(s => s.status === 'waiting').length}
            </div>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="w-full">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Chat Sessions List */}
            <Card className="bg-card border-0 shadow-none">
              <div className="p-4 border-b border-border">
                <h3 className="font-fjalla font-bold text-card-foreground text-lg uppercase tracking-wide">
                  Chat Sessions
                </h3>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-center py-8">No active chat sessions</p>
                    <div className="flex justify-center">
                      <Button onClick={handleSignOut} variant="outline" className="w-full max-w-xs">
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          selectedSession?.id === session.id
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-background hover:bg-background/80 border-border'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Session Header */}
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedSession(session);
                                loadMessages(session.id);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-source font-medium text-card-foreground">
                                  Session {session.id.slice(0, 8)}
                                </p>
                                <Badge className={`text-xs px-2 py-0.5 ${getSessionStatusColor(session.status)}`}>
                                  {session.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Started: {new Date(session.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Session and Action Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            {/* Session Info - Left aligned */}
                            <div className="text-xs text-muted-foreground">
                              {session.status === 'ended' && session.ended_at && (
                                <span>Ended: {formatTimeAgo(session.ended_at)}</span>
                              )}
                              {session.status !== 'ended' && (
                                <span>Duration: {formatTimeAgo(session.created_at)}</span>
                              )}
                            </div>
                            
                            {/* Action Buttons - Right aligned */}
                            <div className="flex items-center gap-2">
                              {/* End Chat Button - Always visible but disabled for ended sessions */}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEndChat(session.id);
                                }}
                                size="sm"
                                variant="destructive"
                                disabled={session.status === 'ended'}
                                className="h-8 px-3 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {session.status === 'ended' ? 'Chat Ended' : 'End Chat'}
                              </Button>
                              
                              {/* View Messages Button */}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                  loadMessages(session.id);
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs font-medium"
                              >
                                View Messages
                              </Button>
                            </div>
                          </div>

                          {/* Last Message Info */}
                          {session.lastMessage && (
                            <div className="border-t border-border pt-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span className="font-medium">
                                  Last message in this Chat came from: {session.lastMessage.sender_type === 'specialist' ? 'You' : 'User'}
                                </span>
                                <span>{formatTimeAgo(session.lastMessage.created_at)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground/80 truncate">
                                {session.lastMessage.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Chat Messages */}
            {selectedSession ? (
              <Card className="bg-card border-0 shadow-none">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-fjalla font-bold text-card-foreground text-lg uppercase tracking-wide">
                        Chat Messages
                      </h3>
                      <p className="text-xs text-muted-foreground">Session {selectedSession.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={startPhoneCall}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Phone size={16} />
                      </Button>
                      <Button
                        onClick={startVideoCall}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Video size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col h-[400px]">
                  <div id="messages-container" className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'specialist' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender_type === 'specialist'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {messages.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No messages yet</p>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your response..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 bg-background border-border"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim()}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-card border-0 shadow-none">
                <div className="p-8 h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Select a chat session to view messages</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-fjalla font-bold uppercase tracking-wide">Update Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {(['online', 'busy', 'offline'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => {
                    updateStatus(status);
                    setIsStatusDialogOpen(false);
                  }}
                  variant="outline"
                  className={`w-full justify-start ${
                    specialistStatus?.status === status ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status).split(' ')[0]}`} />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeerSpecialistDashboard;