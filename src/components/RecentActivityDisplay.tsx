
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MessageSquare, 
  Calendar, 
  User, 
  Activity,
  ChevronRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import SpecialistActivityLog from './SpecialistActivityLog';

interface ActivityEvent {
  id: string;
  event_type: string;
  timestamp: string;
  metadata: any;
  session_id?: string;
  user_id?: string;
}

interface RecentActivityDisplayProps {
  specialistId: string;
  showFullLog?: boolean;
}

const RecentActivityDisplay: React.FC<RecentActivityDisplayProps> = ({ 
  specialistId, 
  showFullLog = false 
}) => {
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadRecentActivity();
  }, [specialistId]);

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('peer_performance_events')
        .select('*')
        .eq('peer_id', specialistId)
        .order('timestamp', { ascending: false })
        .limit(showFullLog ? 50 : 5);

      if (error) throw error;
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'status_change':
        return <Activity size={16} className="text-blue-500" />;
      case 'chat_session_started':
      case 'chat_session_ended':
        return <MessageSquare size={16} className="text-green-500" />;
      case 'appointment_scheduled':
      case 'appointment_completed':
        return <Calendar size={16} className="text-purple-500" />;
      case 'message_sent':
        return <MessageSquare size={16} className="text-gray-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getEventDescription = (event: ActivityEvent) => {
    const { event_type, metadata } = event;
    
    switch (event_type) {
      case 'status_change':
        return `Status changed to ${metadata?.new_status || 'unknown'}`;
      case 'chat_session_started':
        return 'Started a new chat session';
      case 'chat_session_ended':
        return 'Ended chat session';
      case 'appointment_scheduled':
        return `Scheduled ${metadata?.appointment_type || 'appointment'}`;
      case 'appointment_completed':
        return `Completed ${metadata?.appointment_type || 'appointment'}`;
      case 'message_sent':
        return 'Sent a message';
      default:
        return event_type.replace(/_/g, ' ');
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'status_change':
        return 'bg-blue-100 text-blue-800';
      case 'chat_session_started':
      case 'chat_session_ended':
        return 'bg-green-100 text-green-800';
      case 'appointment_scheduled':
      case 'appointment_completed':
        return 'bg-purple-100 text-purple-800';
      case 'message_sent':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Recent Activity
          </h3>
          {!showFullLog && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowActivityLog(true)}
              className="text-sm"
            >
              View All
              <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as you interact with users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {getEventDescription(event)}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getEventBadgeColor(event.event_type)}`}
                    >
                      {event.event_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.metadata.duration && `Duration: ${event.metadata.duration}min`}
                      {event.metadata.user_count && ` • ${event.metadata.user_count} users`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity Log Modal */}
      <SpecialistActivityLog 
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        specialistId={specialistId}
      />
    </>
  );
};

export default RecentActivityDisplay;
