import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User, MessageSquare, Settings, Activity, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: 'status_change' | 'session_start' | 'session_end' | 'message_sent' | 'login' | 'logout';
  description: string;
  metadata?: any;
}

interface SpecialistActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
  specialistId: string;
}

const SpecialistActivityLog = ({ isOpen, onClose, specialistId }: SpecialistActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadActivityLog = async () => {
    if (!specialistId) return;
    
    try {
      setLoading(true);
      
      // Get recent status changes
      const { data: statusChanges } = await supabase
        .from('specialist_status')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('updated_at', { ascending: false })
        .limit(10);

      // Get recent chat sessions
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent messages sent by specialist
      const { data: messages } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat_sessions!inner(specialist_id)
        `)
        .eq('sender_type', 'specialist')
        .eq('chat_sessions.specialist_id', specialistId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Combine and format all activities
      const allActivities: ActivityEntry[] = [];

      // Add status changes
      statusChanges?.forEach(status => {
        allActivities.push({
          id: `status-${status.id}`,
          timestamp: status.updated_at,
          type: 'status_change',
          description: `Status changed to ${status.status}${status.status_message ? ` - ${status.status_message}` : ''}`,
          metadata: { status: status.status, message: status.status_message }
        });
      });

      // Add session activities
      sessions?.forEach(session => {
        allActivities.push({
          id: `session-start-${session.id}`,
          timestamp: session.started_at || session.created_at,
          type: 'session_start',
          description: `Started chat session ${session.id.slice(0, 8)}`,
          metadata: { sessionId: session.id, status: session.status }
        });

        if (session.ended_at) {
          allActivities.push({
            id: `session-end-${session.id}`,
            timestamp: session.ended_at,
            type: 'session_end',
            description: `Ended chat session ${session.id.slice(0, 8)}`,
            metadata: { sessionId: session.id }
          });
        }
      });

      // Add message activities (summarized by session)
      const messageCounts: { [sessionId: string]: number } = {};
      messages?.forEach(message => {
        messageCounts[message.session_id] = (messageCounts[message.session_id] || 0) + 1;
      });

      Object.entries(messageCounts).forEach(([sessionId, count]) => {
        const latestMessage = messages?.find(m => m.session_id === sessionId);
        if (latestMessage) {
          allActivities.push({
            id: `messages-${sessionId}`,
            timestamp: latestMessage.created_at,
            type: 'message_sent',
            description: `Sent ${count} message${count > 1 ? 's' : ''} in session ${sessionId.slice(0, 8)}`,
            metadata: { sessionId, messageCount: count }
          });
        }
      });

      // Sort by timestamp (newest first)
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(allActivities.slice(0, 50)); // Limit to 50 most recent activities

    } catch (error) {
      console.error('Error loading activity log:', error);
      toast({
        title: "Error",
        description: "Failed to load activity log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && specialistId) {
      loadActivityLog();
    }
  }, [isOpen, specialistId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'session_start':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'session_end':
        return <X className="h-4 w-4 text-red-500" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'login':
        return <User className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const variants = {
      'status_change': 'secondary',
      'session_start': 'default',
      'session_end': 'destructive',
      'message_sent': 'outline',
      'login': 'default',
      'logout': 'secondary'
    } as const;

    const labels = {
      'status_change': 'Status Change',
      'session_start': 'Session Started',
      'session_end': 'Session Ended',
      'message_sent': 'Messages Sent',
      'login': 'Login',
      'logout': 'Logout'
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'} className="text-xs">
        {labels[type as keyof typeof labels] || type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {activities.filter(a => a.type === 'session_start').length}
                </div>
                <p className="text-xs text-muted-foreground">Sessions Started</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.type === 'message_sent').reduce((sum, a) => sum + (a.metadata?.messageCount || 1), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Messages Sent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {activities.filter(a => a.type === 'status_change').length}
                </div>
                <p className="text-xs text-muted-foreground">Status Changes</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity List */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground">Your activity will appear here as you use the platform</p>
              </div>
            ) : (
              <div className="divide-y">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActivityBadge(activity.type)}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={loadActivityLog} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistActivityLog;