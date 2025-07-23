import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface SpecialistChatProps {
  specialistId: string | null;
}

const SpecialistChat: React.FC<SpecialistChatProps> = ({ specialistId }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Chat functionality will be available here. Specialist ID: {specialistId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecialistChat;