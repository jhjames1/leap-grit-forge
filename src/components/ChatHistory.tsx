import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Clock, User, MessageSquare, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  specialistId: string;
}

const ChatHistory = ({ isOpen, onClose, specialistId }: ChatHistoryProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const { toast } = useToast();

  const loadChatHistory = async () => {
    if (!specialistId) return;
    
    setIsLoading(true);
    try {
      // Get ended sessions for this specialist
      const { data: endedSessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('status', 'ended')
        .order('ended_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user profiles for sessions
      if (endedSessions && endedSessions.length > 0) {
        const userIds = endedSessions.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const sessionsWithProfiles = endedSessions.map(session => {
          const profile = profiles?.find(p => p.user_id === session.user_id);
          return {
            ...session,
            user_first_name: profile?.first_name,
            user_last_name: profile?.last_name
          } as ChatSession;
        });

        setSessions(sessionsWithProfiles);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return messages || [];
    } catch (error) {
      console.error('Error loading session messages:', error);
      return [];
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen, specialistId]);

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    
    const userName = session.user_first_name && session.user_last_name 
      ? `${session.user_first_name} ${session.user_last_name}`
      : 'Anonymous User';
    
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           session.session_number.toString().includes(searchTerm);
  });

  const handleSessionClick = async (session: ChatSession) => {
    setSelectedSession(session);
    const messages = await loadSessionMessages(session.id);
    // You could store messages in state or show them in a separate view
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat History
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user name or session number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sessions List */}
            <div className="w-1/2 border-r">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <div className="text-center text-muted-foreground py-8">
                      Loading chat history...
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No chat history found</p>
                      {searchTerm && (
                        <p className="text-xs mt-1">Try adjusting your search</p>
                      )}
                    </div>
                  ) : (
                    filteredSessions.map((session) => (
                      <Card 
                        key={session.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleSessionClick(session)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                  Ended
                                </Badge>
                                <span className="text-sm font-medium">#{session.session_number}</span>
                              </div>
                              
                              <p className="font-medium text-sm">
                                {session.user_first_name && session.user_last_name
                                  ? `${session.user_first_name} ${session.user_last_name.charAt(0)}.`
                                  : 'Anonymous User'
                                }
                              </p>
                              
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(session.started_at), 'MMM d, HH:mm')}
                                </div>
                                {session.ended_at && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    Ended {format(new Date(session.ended_at), 'HH:mm')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Session Details */}
            <div className="w-1/2 flex flex-col">
              {selectedSession ? (
                <div className="p-4 flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Session #{selectedSession.session_number}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">User:</span>
                        <p className="font-medium">
                          {selectedSession.user_first_name && selectedSession.user_last_name
                            ? `${selectedSession.user_first_name} ${selectedSession.user_last_name.charAt(0)}.`
                            : 'Anonymous User'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">
                          {selectedSession.started_at && selectedSession.ended_at
                            ? `${Math.round((new Date(selectedSession.ended_at).getTime() - new Date(selectedSession.started_at).getTime()) / (1000 * 60))} minutes`
                            : 'Unknown'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <p className="font-medium">
                          {format(new Date(selectedSession.started_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ended:</span>
                        <p className="font-medium">
                          {selectedSession.ended_at
                            ? format(new Date(selectedSession.ended_at), 'MMM d, yyyy HH:mm')
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Message history details</p>
                    <p className="text-xs mt-1">Feature coming soon</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a session to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistory;