
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, ChevronRight, User } from 'lucide-react';
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
  pending_proposals_count?: number;
  has_new_responses?: boolean;
  isLoading?: boolean;
}

interface SessionCardProps {
  session: ChatSession;
  isSelected: boolean;
  isWaitingTooLong: boolean;
  onClick: () => void;
  formatSessionName: (session: ChatSession) => string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isSelected,
  isWaitingTooLong,
  onClick,
  formatSessionName
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent any default behaviors that might cause scrolling
    e.preventDefault();
    e.stopPropagation();
    
    // Only call onClick if session is not loading
    if (!session.isLoading) {
      onClick();
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      } ${
        isWaitingTooLong ? 'bg-warning border-warning-foreground/20' : ''
      } ${
        session.status === 'waiting' && !session.specialist_id ? 'bg-blue-50/50 border-blue-200' : ''
      } ${
        session.isLoading ? 'opacity-60 pointer-events-none' : ''
      }`} 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {session.isLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <User className="text-primary" size={16} />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-fjalla font-bold">{formatSessionName(session)}</span>
              
              {session.isLoading ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Claiming...
                </Badge>
              ) : (
                <>
                  <Badge 
                    variant={session.status === 'active' ? 'default' : session.status === 'waiting' ? 'secondary' : 'outline'} 
                    className={session.status === 'waiting' && !session.specialist_id ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                  >
                    {session.status === 'waiting' && !session.specialist_id ? 'Available' : session.status}
                  </Badge>
                  
                  {session.status === 'waiting' && !session.specialist_id && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Click to claim
                    </Badge>
                  )}
                </>
              )}
              
              {/* Proposal indicators */}
              {session.pending_proposals_count && session.pending_proposals_count > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-orange-700 border-orange-200">
                  <Calendar className="w-3 h-3 mr-1" />
                  {session.pending_proposals_count} pending
                </Badge>
              )}
              
              {session.has_new_responses && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  New response
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-source">
              Started {format(new Date(session.started_at), 'MMM d, h:mm a')}
              {session.status === 'waiting' && !session.specialist_id && (
                <span className="ml-2 text-blue-600">• Unassigned</span>
              )}
              {session.isLoading && (
                <span className="ml-2 text-blue-600">• Processing...</span>
              )}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
    </div>
  );
};

export default SessionCard;
