
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Settings, Shield, AlertCircle } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  action: string;
  type: string;
  details: string;
  created_at: string;
  timestamp: string;
}

interface AdminActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  adminEmail: string;
  adminName: string;
}

const AdminActivityLogModal = ({ isOpen, onClose, adminId, adminEmail, adminName }: AdminActivityLogModalProps) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && adminId) {
      fetchActivityLogs();
    }
  }, [isOpen, adminId]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', adminId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string, type: string) => {
    if (type === 'admin_management') return <Shield className="h-4 w-4" />;
    if (action.includes('session')) return <User className="h-4 w-4" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'admin_management': return 'bg-red-500/20 text-red-400 border-red-200';
      case 'chat_session': return 'bg-blue-500/20 text-blue-400 border-blue-200';
      case 'user_management': return 'bg-green-500/20 text-green-400 border-green-200';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-200';
    }
  };

  const formatActionDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="text-xs text-muted-foreground">
          <span className="font-medium">{key}:</span> {String(value)}
        </div>
      ));
    } catch {
      return <div className="text-xs text-muted-foreground">{details}</div>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Activity Log: {adminName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">{adminEmail}</div>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading activity logs...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No activity logs found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                    <div className="mt-0.5">
                      {getActionIcon(activity.action, activity.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground">
                            {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <Badge variant="outline" className={getActionBadgeColor(activity.type)}>
                            {activity.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                      
                      {activity.details && (
                        <div className="space-y-1">
                          {formatActionDetails(activity.details)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < activities.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AdminActivityLogModal;
