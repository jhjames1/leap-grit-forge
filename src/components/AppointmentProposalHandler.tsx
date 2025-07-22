
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Check, X, Timer, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
        description: string;
        start_date: string;
        start_time: string;
        duration: string;
        frequency: string;
        occurrences: string;
        specialist_id?: string;
        user_id?: string;
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
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);
  const [appointmentCreationStatus, setAppointmentCreationStatus] = useState<'idle' | 'creating' | 'success' | 'failed'>('idle');
  const { toast } = useToast();
  const { user } = useAuth();

  // Only show proposal actions for appointment proposals
  const isAppointmentProposal = message.metadata?.action_type === 'appointment_proposal' || 
                                message.metadata?.action_type === 'recurring_appointment_proposal';
                                
  if (!isAppointmentProposal || !message.metadata?.proposal_id) {
    return null;
  }

  const proposalData = message.metadata.proposal_data;
  if (!proposalData) return null;

  const isRecurringProposal = message.metadata?.action_type === 'recurring_appointment_proposal';

  // Determine the current user's role in this proposal
  const [userRole, setUserRole] = useState<'sender' | 'recipient' | 'unknown'>('unknown');
  
  useEffect(() => {
    const determineUserRole = async () => {
      if (!user) return;
      
      try {
        // Check if current user is a specialist
        const { data: specialistData } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (specialistData && specialistData.id === proposalData.specialist_id) {
          setUserRole('sender');
        } else if (user.id === proposalData.user_id) {
          setUserRole('recipient');
        } else {
          setUserRole('unknown');
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        setUserRole('unknown');
      }
    };

    determineUserRole();
  }, [user, proposalData.specialist_id, proposalData.user_id]);

  // Load proposal status
  useEffect(() => {
    const loadProposalStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_proposals')
          .select('status, responded_at')
          .eq('id', proposalData.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProposalStatus(data.status);
          setResponded(data.status !== 'pending');
          
          // Check if appointments were already created for this proposal
          if (data.status === 'accepted') {
            const { data: appointmentData } = await supabase
              .from('scheduled_appointments')
              .select('id')
              .eq('proposal_id', proposalData.id)
              .limit(1);
            
            if (appointmentData && appointmentData.length > 0) {
              setAppointmentCreationStatus('success');
            }
          }
        }
      } catch (error) {
        console.error('Error loading proposal status:', error);
      }
    };

    loadProposalStatus();
  }, [proposalData.id]);

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
    // Only recipients can respond to proposals
    if (userRole !== 'recipient') {
      toast({
        title: "Error",
        description: "You cannot respond to this proposal.",
        variant: "destructive"
      });
      return;
    }

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
        setAppointmentCreationStatus('creating');
        
        // Call unified appointment creation function with better error handling
        const { data: functionResult, error: functionError } = await supabase.functions.invoke('create-appointments', {
          body: { 
            proposalId: proposalData.id,
            isRecurring: isRecurringProposal
          }
        });

        if (functionError) {
          console.error('Function invocation error:', functionError);
          setAppointmentCreationStatus('failed');
          throw new Error(`Failed to create appointments: ${functionError.message}`);
        }

        if (!functionResult?.success) {
          console.error('Function returned error:', functionResult);
          setAppointmentCreationStatus('failed');
          throw new Error(functionResult?.error || 'Unknown error creating appointments');
        }

        setAppointmentCreationStatus('success');
        
        toast({
          title: "Proposal Accepted",
          description: `${isRecurringProposal ? 'Recurring appointments' : 'Appointment'} have been scheduled successfully and added to both calendars!`,
          duration: 8000
        });
      } else {
        toast({
          title: "Proposal Rejected",
          description: "The appointment proposal has been declined."
        });
      }

      setProposalStatus(response);
      setResponded(true);
      onResponse?.();
      
    } catch (error) {
      console.error('Error handling proposal response:', error);
      setAppointmentCreationStatus('failed');
      toast({
        title: "Error",
        description: `Failed to process your response: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show different UI based on user role and proposal status
  const getStatusMessage = () => {
    if (userRole === 'sender') {
      if (proposalStatus === 'accepted') {
        if (appointmentCreationStatus === 'creating') {
          return "⏳ Creating appointments...";
        } else if (appointmentCreationStatus === 'success') {
          return "✅ Your proposal has been accepted and appointments have been created!";
        } else if (appointmentCreationStatus === 'failed') {
          return "⚠️ Your proposal was accepted but there was an issue creating the appointments.";
        }
        return "✅ Your proposal has been accepted!";
      } else if (proposalStatus === 'rejected') {
        return "❌ Your proposal has been declined.";
      } else if (expired) {
        return "⏰ Your proposal has expired.";
      } else {
        return "📤 Proposal sent - waiting for response...";
      }
    } else if (userRole === 'recipient') {
      if (proposalStatus === 'accepted') {
        if (appointmentCreationStatus === 'creating') {
          return "⏳ Creating your appointments...";
        } else if (appointmentCreationStatus === 'success') {
          return "✅ You have accepted this proposal and appointments have been created!";
        } else if (appointmentCreationStatus === 'failed') {
          return "⚠️ You accepted this proposal but there was an issue creating the appointments.";
        }
        return "✅ You have accepted this proposal.";
      } else if (proposalStatus === 'rejected') {
        return "❌ You have declined this proposal.";
      } else if (expired) {
        return "⏰ This proposal has expired.";
      } else {
        return "📥 Awaiting your response...";
      }
    }
    return "🔄 Loading proposal status...";
  };

  const getStatusColor = () => {
    if (appointmentCreationStatus === 'creating') return 'bg-blue-50 border-blue-200';
    if (appointmentCreationStatus === 'failed') return 'bg-red-50 border-red-200';
    if (proposalStatus === 'accepted') return 'bg-green-50 border-green-200';
    if (proposalStatus === 'rejected') return 'bg-red-50 border-red-200';
    if (expired) return 'bg-gray-50 border-gray-200';
    if (userRole === 'sender') return 'bg-blue-50 border-blue-200';
    return 'bg-primary/5 border-primary/20';
  };

  // If user role is unknown, don't show the proposal handler
  if (userRole === 'unknown') {
    return null;
  }

  return (
    <Card className={`p-4 mt-2 ${getStatusColor()}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {isRecurringProposal ? 'Recurring Appointment Proposal' : 'Appointment Proposal'}
          </span>
          {userRole === 'sender' && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
              <User className="w-3 h-3 mr-1" />
              Sent by you
            </Badge>
          )}
          {!responded && !expired && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
              <Timer className="w-3 h-3 mr-1" />
              Expires in 7 days
            </Badge>
          )}
          {appointmentCreationStatus === 'creating' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Creating...
            </Badge>
          )}
        </div>

        <div className="text-sm font-medium text-center py-2">
          {getStatusMessage()}
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
            {isRecurringProposal 
              ? `${proposalData.frequency} starting ${proposalData.start_date} at ${proposalData.start_time}`
              : `${proposalData.start_date} at ${proposalData.start_time}`
            }
          </div>
          <div className="flex items-center gap-2">
            <strong>Duration:</strong> {proposalData.duration} minutes per session
          </div>
          {isRecurringProposal && (
            <div className="flex items-center gap-2">
              <strong>Total Sessions:</strong> {proposalData.occurrences}
            </div>
          )}
        </div>

        {userRole === 'recipient' && !responded && !expired && (
          <>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>What happens next:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 ml-4 space-y-1">
                {isRecurringProposal ? (
                  <>
                    <li>• If you accept, recurring appointments will be automatically scheduled</li>
                    <li>• You'll receive reminders before each session</li>
                    <li>• You can reschedule individual sessions if needed</li>
                  </>
                ) : (
                  <>
                    <li>• If you accept, the appointment will be scheduled</li>
                    <li>• You'll receive a reminder before the session</li>
                    <li>• You can reschedule if needed</li>
                  </>
                )}
                <li>• This proposal expires in 7 days</li>
                <li>• Appointments will appear in both your calendar and the specialist's calendar</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleResponse('accepted')}
                disabled={loading || appointmentCreationStatus === 'creating'}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                {loading || appointmentCreationStatus === 'creating' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    {appointmentCreationStatus === 'creating' ? 'Creating...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Accept & Schedule
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleResponse('rejected')}
                disabled={loading || appointmentCreationStatus === 'creating'}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </>
        )}

        {appointmentCreationStatus === 'failed' && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ <strong>Appointment Creation Failed:</strong> There was an issue creating the appointments. Please contact support or try again later.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AppointmentProposalHandler;
