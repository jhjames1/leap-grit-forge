import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Clock, MessageSquare, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  last_activity: string | null;
  end_reason: string | null;
  status: string;
  message_count?: number;
  duration_minutes?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

const ChatArchive = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const { toast } = useToast();

  const fetchArchivedSessions = async () => {
    try {
      setLoading(true);
      
      // Get the current specialist's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('peer_specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      // Fetch ended sessions with message counts
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          user_id,
          started_at,
          ended_at,
          status
        `)
        .eq('specialist_id', specialist.id)
        .eq('status', 'ended')
        .order('ended_at', { ascending: false });

      if (error) throw error;

      // Get message counts for each session
      const sessionsWithCounts = await Promise.all(
        (data || []).map(async (session) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          const durationMinutes = session.started_at && session.ended_at
            ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60))
            : 0;

          return {
            ...session,
            last_activity: null,
            end_reason: 'manual', // Default for existing sessions
            message_count: count || 0,
            duration_minutes: durationMinutes
          };
        })
      );

      setSessions(sessionsWithCounts);
      setFilteredSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Error fetching archived sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load archived chat sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedSessions();
  }, []);

  useEffect(() => {
    let filtered = sessions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by end reason
    if (filterBy !== 'all') {
      filtered = filtered.filter(session => session.end_reason === filterBy);
    }

    setFilteredSessions(filtered);
  }, [searchTerm, filterBy, sessions]);

  const loadMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSessionClick = (session: ChatSession) => {
    setSelectedSession(session);
    loadMessages(session.id);
  };

  const getEndReasonBadge = (reason: string) => {
    const variants = {
      'auto_timeout': 'destructive',
      'manual': 'secondary',
      'user_left': 'outline',
    } as const;

    const labels = {
      'auto_timeout': 'Auto Timeout',
      'manual': 'Manual End',
      'user_left': 'User Left',
    };

    return (
      <Badge variant={variants[reason as keyof typeof variants] || 'secondary'}>
        {labels[reason as keyof typeof labels] || reason}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by session ID or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by end reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="auto_timeout">Auto Timeout</SelectItem>
            <SelectItem value="manual">Manual End</SelectItem>
            <SelectItem value="user_left">User Left</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No archived chats found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Ended chat sessions will appear here'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card 
              key={session.id} 
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleSessionClick(session)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium">Session {session.id.slice(0, 8)}</span>
                      {getEndReasonBadge(session.end_reason)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User: {session.user_id.slice(0, 8)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {session.message_count} messages
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.duration_minutes}m duration
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Started: {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}</div>
                    <div>Ended: {format(new Date(session.ended_at), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Messages Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Messages - Session {selectedSession?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Started: {format(new Date(selectedSession.started_at), 'MMM d, yyyy h:mm a')}</span>
                  <span>Ended: {format(new Date(selectedSession.ended_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration: {selectedSession.duration_minutes}m</span>
                  <span>Messages: {selectedSession.message_count}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="border rounded-lg max-h-96 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No messages in this session</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'specialist' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender_type === 'specialist'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_type === 'specialist' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {message.sender_type === 'specialist' ? 'You' : 'User'} • {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatArchive;