import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User } from 'lucide-react';
import RobustSpecialistChatWindow from './RobustSpecialistChatWindow';

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
  end_reason?: string;
}

interface SessionSlotProps {
  session: ChatSession | null;
  slotIndex: number;
  onEndSession: (sessionId: string) => void;
  onSessionUpdate: (session: ChatSession) => void;
}

export const SessionSlot = ({ session, slotIndex, onEndSession, onSessionUpdate }: SessionSlotProps) => {
  if (!session) {
    return (
      <Card className="min-h-[600px] border-dashed border-2 border-muted">
        <CardContent className="flex-1 flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-medium mb-1">Slot {slotIndex + 1} Available</h4>
            <p className="text-xs">Claim a waiting session to fill this slot</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUserName = () => {
    if (session.user_first_name && session.user_last_name) {
      return `${session.user_first_name} ${session.user_last_name}`;
    }
    return `User #${session.session_number}`;
  };

  return (
    <Card className="min-h-[600px] border-l-4 border-l-green-500">
      <CardHeader className="p-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4" />
            {getUserName()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Slot {slotIndex + 1}
            </Badge>
            <Badge variant="outline" className="text-xs">
              #{session.session_number}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <RobustSpecialistChatWindow
          session={session}
          onClose={() => onEndSession(session.id)}
          onSessionUpdate={onSessionUpdate}
        />
      </CardContent>
    </Card>
  );
};