
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isPast } from 'date-fns';

interface AppointmentProposalHandlerProps {
  message: {
    id: string;
    content: string;
    metadata?: {
      proposal_id?: string;
      action_type?: string;
      proposal_data?: {
        id: string;
        title: string;
        description?: string;
        start_date: string;
        start_time: string;
        duration: string;
        frequency: string;
        occurrences: string;
      };
    };
  };
  isUser: boolean;
  onResponse?: () => void;
}

const AppointmentProposalHandler: React.FC<AppointmentProposalHandlerProps> = ({
  message,
  isUser,
  onResponse
}) => {
  const [loading, setLoading] = useState(false);
  const [responded, setResponded] = useState(false);
  const [expired, setExpired] = useState(false);
  const { toast } = useToast();

  // Show proposal actions for user messages and if it's any type of appointment proposal
  const isAppointmentProposal = message.metadata?.action_type === 'appointment_proposal' || 
                               message.metadata?.action_type === 'recurring_appointment_proposal';

  if (isUser || !isAppointmentProposal || !message.metadata?.proposal_id) {
    return null;
  }

  const proposalData = message.metadata.proposal_data;
  if (!proposalData) return null;

  // Check if proposal has expired
  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Assuming 7 days from now
      setExpired(isPast(expiresAt));
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleResponse = async (response: 'accepted' | 'rejected') => {
    setLoading(true);
    
    try {
      // Update the proposal status
      const { error: updateError } = await supabase
        .from('appointment_proposals')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', proposalData.id);

      if (updateError) {
        console.error('Error updating proposal:', updateError);
        throw updateError;
      }

      if (response === 'accepted') {
        // For single appointments, create a scheduled appointment directly
        if (message.metadata?.action_type === 'appointment_proposal') {
          const startDateTime = new Date(`${proposalData.start_date}T${proposalData.start_time}`);
          const endDateTime = new Date(startDateTime.getTime() + parseInt(proposalData.duration) * 60000);

          const { error: appointmentError } = await supabase
            .from('scheduled_appointments')
            .insert({
              proposal_id: proposalData.id,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              specialist_id: '', // This should be set from the proposal
              appointment_type_id: '', // This should be set from the proposal
              scheduled_start: startDateTime.toISOString(),
              scheduled_end: endDateTime.toISOString(),
              status: 'scheduled'
            });

          if (appointmentError) {
            console.error('Error creating scheduled appointment:', appointmentError);
            // Don't throw - the proposal was still accepted
          }

          toast({
            title: "Appointment Accepted",
            description: "Your appointment has been scheduled successfully!"
          });
        } else {
          // For recurring appointments, call the edge function
          const { error: functionError } = await supabase.functions.invoke('create-recurring-appointments', {
            body: { proposalId: proposalData.id }
          });

          if (functionError) {
            console.error('Error creating appointments:', functionError);
            throw functionError;
          }

          toast({
            title: "Proposal Accepted",
            description: "Recurring appointments have been scheduled successfully!"
          });
        }
      } else {
        toast({
          title: "Proposal Rejected",
          description: "The appointment proposal has been declined."
        });
      }

      setResponded(true);
      onResponse?.();
      
    } catch (error) {
      console.error('Error handling proposal response:', error);
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (responded) {
    return (
      <Card className="p-4 mt-2 bg-muted">
        <p className="text-sm text-muted-foreground">
          ✅ You have responded to this proposal.
        </p>
      </Card>
    );
  }

  if (expired) {
    return (
      <Card className="p-4 mt-2 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">
          ⏰ This proposal has expired.
        </p>
      </Card>
    );
  }

  const isRecurring = message.metadata?.action_type === 'recurring_appointment_proposal';

  return (
    <Card className="p-4 mt-2 border-primary/20 bg-primary/5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {isRecurring ? 'Recurring ' : ''}Appointment Proposal
          </span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            Expires in 7 days
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <strong>Title:</strong> {proposalData.title}
          </div>
          {proposalData.description && (
            <div className="flex items-start gap-2">
              <strong>Description:</strong> {proposalData.description}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <strong>Schedule:</strong> 
            {isRecurring ? 
              `${proposalData.frequency} starting ${proposalData.start_date} at ${proposalData.start_time}` :
              `${proposalData.start_date} at ${proposalData.start_time}`
            }
          </div>
          <div className="flex items-center gap-2">
            <strong>Duration:</strong> {proposalData.duration} minutes per session
          </div>
          {isRecurring && (
            <div className="flex items-center gap-2">
              <strong>Total Sessions:</strong> {proposalData.occurrences}
            </div>
          )}
        </div>

        {isRecurring && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>What happens next:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 ml-4 space-y-1">
              <li>• If you accept, recurring appointments will be automatically scheduled</li>
              <li>• You'll receive reminders before each session</li>
              <li>• You can reschedule individual sessions if needed</li>
              <li>• This proposal expires in 7 days</li>
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleResponse('accepted')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept & Schedule
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleResponse('rejected')}
            disabled={loading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            Decline
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentProposalHandler;
