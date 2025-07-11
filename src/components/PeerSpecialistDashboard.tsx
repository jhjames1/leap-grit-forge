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
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Bell, 
  LogOut, 
  Clock,
  User,
  Settings
} from 'lucide-react';

interface ChatSession {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
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

  useEffect(() => {
    if (user) {
      loadSpecialistData();
      loadChatSessions();
      setupRealtimeSubscriptions();
    }
  }, [user]);

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

  const loadChatSessions = async () => {
    if (!specialist) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
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
          setChatSessions(prev => [payload.new as ChatSession, ...prev]);
          toast({
            title: "New Chat Request",
            description: "A user wants to start a chat with you"
          });
        }
      )
      .subscribe();

    // Subscribe to messages in selected session
    let messageChannel: any = null;
    if (selectedSession) {
      messageChannel = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${selectedSession.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(sessionChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);
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
    <div className="p-4 pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-4xl text-foreground mb-1 tracking-wide">
              <span className="font-oswald font-extralight tracking-tight">Peer</span>
              <span className="font-fjalla font-extrabold italic"> Specialist</span>
            </h1>
            <p className="text-steel-light font-oswald">
              Welcome, {specialist.first_name} {specialist.last_name}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 ${getStatusColor(specialistStatus?.status || 'offline')} rounded-full`}></div>
            <Badge className={getStatusBadge(specialistStatus?.status || 'offline')}>
              {specialistStatus?.status || 'offline'}
            </Badge>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsStatusDialogOpen(true)}
            variant="outline"
            className="border-construction text-construction hover:bg-construction/10"
          >
            <Settings className="mr-2 h-4 w-4" />
            Status
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-red-500 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="bg-steel-dark border-steel">
          <TabsTrigger value="sessions">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Sessions List */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
                <h3 className="font-oswald font-semibold text-white mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSession?.id === session.id
                          ? 'bg-construction/20 border border-construction/30'
                          : 'bg-steel-dark/30 hover:bg-steel-dark/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-construction" />
                          <span className="text-white text-sm">User {session.user_id.slice(-6)}</span>
                        </div>
                        <Badge className={`text-xs ${
                          session.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 mt-2 text-xs text-steel-light">
                        <Clock size={12} />
                        <span>{new Date(session.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  {chatSessions.length === 0 && (
                    <p className="text-steel-light text-center py-4">No active chat sessions</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-4 h-[600px] flex flex-col">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-steel-dark pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="text-construction" size={20} />
                      <div>
                        <h3 className="font-semibold text-white">
                          User {selectedSession.user_id.slice(-6)}
                        </h3>
                        <p className="text-steel-light text-sm">
                          Session started {new Date(selectedSession.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={startPhoneCall}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-400 hover:bg-green-500/10"
                      >
                        <Phone size={16} />
                      </Button>
                      <Button
                        onClick={startVideoCall}
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Video size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === 'specialist' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            message.sender_type === 'specialist'
                              ? 'bg-construction text-midnight'
                              : 'bg-steel-dark text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_type === 'specialist' ? 'text-midnight/70' : 'text-steel-light'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {messages.length === 0 && (
                      <p className="text-steel-light text-center py-8">No messages yet</p>
                    )}
                  </div>

                  {/* Message Input would go here */}
                  <div className="border-t border-steel-dark pt-4">
                    <p className="text-steel-light text-sm text-center">
                      Use your preferred chat platform or the main app to respond to messages
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-8 h-[600px] flex items-center justify-center">
                  <p className="text-steel-light">Select a chat session to view messages</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-steel-dark border-steel">
          <DialogHeader>
            <DialogTitle className="text-white">Update Status</DialogTitle>
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
                    specialistStatus?.status === status
                      ? 'border-construction text-construction'
                      : 'border-steel text-steel-light hover:bg-steel/10'
                  }`}
                >
                  <div className={`w-3 h-3 ${getStatusColor(status)} rounded-full mr-3`}></div>
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