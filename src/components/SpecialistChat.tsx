import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface SpecialistChatProps {
  specialistId: string | null;
}

const SpecialistChat: React.FC<SpecialistChatProps> = ({ specialistId }) => {
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Chat Sessions</h3>
        <p className="text-muted-foreground">
          Chat functionality will be available here. Specialist ID: {specialistId}
        </p>
      </Card>
    </div>
  );
};

export default SpecialistChat;