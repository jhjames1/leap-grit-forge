
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Timer } from 'lucide-react';

interface SpecialistProposalStatusProps {
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
  proposalStatus: string;
}

const SpecialistProposalStatus: React.FC<SpecialistProposalStatusProps> = ({
  message,
  proposalStatus
}) => {
  const proposalData = message.metadata?.proposal_data;
  if (!proposalData) return null;

  const isRecurringProposal = message.metadata?.action_type === 'recurring_appointment_proposal';

  const getStatusMessage = () => {
    switch (proposalStatus) {
      case 'accepted':
        return "✅ Your proposal has been accepted!";
      case 'rejected':
        return "❌ Your proposal has been declined.";
      case 'expired':
        return "⏰ Your proposal has expired.";
      default:
        return "📤 Proposal sent - waiting for response...";
    }
  };

  const getStatusColor = () => {
    switch (proposalStatus) {
      case 'accepted':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'expired':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className={`p-4 mt-2 ${getStatusColor()}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {isRecurringProposal ? 'Recurring Appointment Proposal' : 'Appointment Proposal'}
          </span>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
            <User className="w-3 h-3 mr-1" />
            Sent by you
          </Badge>
          {proposalStatus === 'pending' && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
              <Timer className="w-3 h-3 mr-1" />
              Awaiting response
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

        {proposalStatus === 'pending' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Status:</strong> Your proposal has been sent to the client. 
              They have 7 days to respond before it expires.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SpecialistProposalStatus;
