import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChatSession } from '@/hooks/useChatSession';

interface RecurringAppointmentSchedulerProps {
  specialistId: string;
  userId: string;
  chatSessionId: string;
}

const RecurringAppointmentScheduler = ({ 
  specialistId, 
  userId, 
  chatSessionId 
}: RecurringAppointmentSchedulerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    duration: '30',
    frequency: 'weekly',
    dayOfWeek: '',
    occurrences: '4'
  });
  const { toast } = useToast();
  const { sendMessage } = useChatSession(specialistId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get appointment type (default to first available)
      const { data: appointmentTypes } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      const appointmentTypeId = appointmentTypes?.[0]?.id;
      if (!appointmentTypeId) {
        throw new Error('No appointment types available');
      }

      // Create appointment proposal in database
      const { data: proposal, error: proposalError } = await supabase
        .from('appointment_proposals')
        .insert({
          specialist_id: specialistId,
          user_id: userId,
          appointment_type_id: appointmentTypeId,
          title: formData.title,
          description: formData.description,
          start_date: formData.startDate,
          start_time: formData.startTime,
          duration: parseInt(formData.duration),
          frequency: formData.frequency,
          occurrences: parseInt(formData.occurrences),
          chat_session_id: chatSessionId,
          status: 'pending'
        })
        .select()
        .single();

      if (proposalError) {
        console.error('Error creating proposal:', proposalError);
        throw proposalError;
      }

      // Get the current user's ID (the specialist)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Send proposal message to chat with proposal ID
      const messageResult = await supabase
        .from('chat_messages')
        .insert({
          session_id: chatSessionId,
          sender_id: currentUser.id,
          sender_type: 'specialist',
          message_type: 'system',
          content: `🗓️ **Recurring Appointment Proposal**\n\n**${formData.title}**\n\n${formData.description}\n\n📅 **Schedule:** ${formData.frequency} starting ${formData.startDate} at ${formData.startTime}\n⏱️ **Duration:** ${formData.duration} minutes\n🔄 **Occurrences:** ${formData.occurrences} sessions\n\n*Please respond with "accept" or "reject" to this proposal. It expires in 7 days.*`,
          metadata: { 
            proposal_id: proposal.id,
            action_type: 'recurring_appointment_proposal',
            proposal_data: {
              id: proposal.id,
              title: formData.title,
              description: formData.description,
              start_date: formData.startDate,
              start_time: formData.startTime,
              duration: formData.duration,
              frequency: formData.frequency,
              occurrences: formData.occurrences,
              specialist_id: proposal.specialist_id,
              user_id: proposal.user_id
            }
          }
        });

      if (messageResult.error) {
        console.error('Error sending chat message:', messageResult.error);
        throw messageResult.error;
      }

      // Activate the session if it's in waiting status
      console.log('Checking session status and activating if needed...');
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('status')
        .eq('id', chatSessionId)
        .single();

      if (sessionData?.status === 'waiting') {
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({ status: 'active' })
          .eq('id', chatSessionId);

        if (updateError) {
          console.error('Error updating session status:', updateError);
        } else {
          console.log('Session status updated to active');
        }
      }

      toast({
        title: "Success",
        description: "Recurring appointment proposal sent successfully"
      });

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        duration: '30',
        frequency: 'weekly',
        dayOfWeek: '',
        occurrences: '4'
      });
    } catch (error) {
      console.error('Error sending appointment proposal:', error);
      toast({
        title: "Error",
        description: "Failed to send appointment proposal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-steel hover:bg-steel-light text-white">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Recurring
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Schedule Recurring Appointment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Appointment Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Weekly Check-in"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the appointment purpose"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurrences">Number of Occurrences</Label>
            <Select value={formData.occurrences} onValueChange={(value) => setFormData({ ...formData, occurrences: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 sessions</SelectItem>
                <SelectItem value="4">4 sessions</SelectItem>
                <SelectItem value="6">6 sessions</SelectItem>
                <SelectItem value="8">8 sessions</SelectItem>
                <SelectItem value="12">12 sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringAppointmentScheduler;
