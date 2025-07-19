
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface AppointmentProposal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  duration: number;
  frequency: string;
  occurrences: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
  proposed_at: string;
  responded_at?: string;
  user_first_name?: string;
  user_last_name?: string;
}

interface ProposalManagementProps {
  specialistId: string;
}

const ProposalManagement: React.FC<ProposalManagementProps> = ({ specialistId }) => {
  const [proposals, setProposals] = useState<AppointmentProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_proposals')
        .select(`
          *,
          appointment_types(name, color)
        `)
        .eq('specialist_id', specialistId)
        .in('status', ['pending', 'accepted', 'rejected'])
        .order('proposed_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = (data || []).map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const proposalsWithUserInfo = (data || []).map(proposal => {
        const userProfile = profiles?.find(p => p.user_id === proposal.user_id);
        return {
          ...proposal,
          user_first_name: userProfile?.first_name || 'Unknown',
          user_last_name: userProfile?.last_name || 'User',
          status: proposal.status as 'pending' | 'accepted' | 'rejected' | 'expired'
        };
      });

      setProposals(proposalsWithUserInfo);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment proposals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();

    // Set up real-time subscription for proposal updates
    const channel = supabase
      .channel('proposal-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_proposals',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('Proposal update:', payload);
          fetchProposals();
          
          // Show notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            const status = payload.new.status;
            toast({
              title: "Proposal Updated",
              description: `A proposal has been ${status}`,
              variant: status === 'accepted' ? 'default' : 'destructive'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [specialistId, toast]);

  const withdrawProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_proposals')
        .update({ status: 'expired' })
        .eq('id', proposalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proposal withdrawn successfully"
      });
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw proposal",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (proposal: AppointmentProposal) => {
    const now = new Date();
    const expiresAt = new Date(proposal.expires_at);
    const isExpired = isPast(expiresAt);

    if (isExpired && proposal.status === 'pending') {
      return <Badge variant="outline" className="bg-gray-100"><Timer className="w-3 h-3 mr-1" />Expired</Badge>;
    }

    switch (proposal.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-100"><Timer className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (isPast(expiry)) {
      return 'Expired';
    }
    
    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`;
  };

  const formatUserName = (proposal: AppointmentProposal) => {
    if (proposal.user_first_name) {
      const lastInitial = proposal.user_last_name ? ` ${proposal.user_last_name.charAt(0)}.` : '';
      return `${proposal.user_first_name}${lastInitial}`;
    }
    return 'User';
  };

  const pendingProposals = proposals.filter(p => p.status === 'pending' && !isPast(new Date(p.expires_at)));
  const respondedProposals = proposals.filter(p => p.status !== 'pending' || isPast(new Date(p.expires_at)));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading proposals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Pending Proposals ({pendingProposals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingProposals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No pending proposals</p>
          ) : (
            <div className="space-y-4">
              {pendingProposals.map(proposal => (
                <div key={proposal.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">{formatUserName(proposal)}</span>
                      {getStatusBadge(proposal)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getTimeUntilExpiry(proposal.expires_at)}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{proposal.title}</h3>
                  {proposal.description && (
                    <p className="text-sm text-muted-foreground mb-3">{proposal.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(proposal.start_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{proposal.start_time}</span>
                    </div>
                    <div>
                      <strong>Frequency:</strong> {proposal.frequency}
                    </div>
                    <div>
                      <strong>Sessions:</strong> {proposal.occurrences}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => withdrawProposal(proposal.id)}
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responded Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recent Proposals ({respondedProposals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {respondedProposals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent proposals</p>
          ) : (
            <div className="space-y-3">
              {respondedProposals.slice(0, 5).map(proposal => (
                <div key={proposal.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">{formatUserName(proposal)}</span>
                      {getStatusBadge(proposal)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(proposal.proposed_at), 'MMM d')}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <strong>{proposal.title}</strong> - {format(new Date(proposal.start_date), 'MMM d')} at {proposal.start_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalManagement;
