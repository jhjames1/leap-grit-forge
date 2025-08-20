import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  session_number: number;
  user_first_name?: string;
  user_last_name?: string;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

interface WaitingSessionCardProps {
  session: ChatSession;
  onClaimToSlot: (slotIndex: number) => void;
  availableSlots: boolean[];
}

export const WaitingSessionCard = ({ session, onClaimToSlot, availableSlots }: WaitingSessionCardProps) => {
  const waitTime = session.started_at ? 
    Math.floor((Date.now() - new Date(session.started_at).getTime()) / (1000 * 60)) : 0;

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getUserName = () => {
    if (session.user_first_name && session.user_last_name) {
      return `${session.user_first_name} ${session.user_last_name}`;
    }
    return `User #${session.session_number}`;
  };

  const availableSlotIndexes = availableSlots
    .map((available, index) => available ? index : -1)
    .filter(index => index !== -1);

  return (
    <Card className="min-w-[280px] max-w-[280px] flex-shrink-0 border-l-4 border-l-orange-500">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">{getUserName()}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            #{session.session_number}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Waiting {formatWaitTime(waitTime)}</span>
        </div>
        
        <div className="space-y-1">
          {availableSlotIndexes.length > 0 ? (
            <div className="flex gap-1">
              {availableSlotIndexes.map(slotIndex => (
                <Button
                  key={slotIndex}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={() => onClaimToSlot(slotIndex)}
                >
                  Claim to Slot {slotIndex + 1}
                </Button>
              ))}
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              disabled
            >
              All Slots Occupied
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};