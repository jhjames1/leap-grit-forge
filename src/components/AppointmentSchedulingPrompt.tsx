import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Clock } from 'lucide-react';

interface AppointmentSchedulingPromptProps {
  onScheduleAppointment: () => void;
  onDismiss: () => void;
  sessionDurationMinutes: number;
}

const AppointmentSchedulingPrompt: React.FC<AppointmentSchedulingPromptProps> = ({
  onScheduleAppointment,
  onDismiss,
  sessionDurationMinutes
}) => {
  return (
    <Card className="p-4 mt-3 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            You've been chatting for {Math.round(sessionDurationMinutes)} minutes
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            <strong>Consider talking to a peer specialist</strong> who's been where you are. 
            They can offer personalized support and different perspectives beyond our chat.
          </p>
          
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3 mt-0.5 text-primary" />
            <span>Connect with someone who understands your journey firsthand</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={onScheduleAppointment}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Schedule with Specialist
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDismiss}
            className="text-muted-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentSchedulingPrompt;