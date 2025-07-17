import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        description: string;
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
  const { toast } = useToast();

  // Only show proposal actions for user messages and if it's an appointment proposal
  if (isUser || message.metadata?.action_type !== 'recurring_appointment_proposal' || !message.metadata?.proposal_id) {
    return null;
  }

  const proposalData = message.metadata.proposal_data;
  if (!proposalData) return null;

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
        // Call edge function to create recurring appointments
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
          You have responded to this proposal.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 mt-2 border-primary/20 bg-primary/5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Appointment Proposal Response</span>
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
            <strong>Schedule:</strong> {proposalData.frequency} starting {proposalData.start_date} at {proposalData.start_time}
          </div>
          <div className="flex items-center gap-2">
            <strong>Duration:</strong> {proposalData.duration} minutes
          </div>
          <div className="flex items-center gap-2">
            <strong>Sessions:</strong> {proposalData.occurrences} total
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleResponse('accepted')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleResponse('rejected')}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentProposalHandler;