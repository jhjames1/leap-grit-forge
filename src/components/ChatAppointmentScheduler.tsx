
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Users, X, Plus, Repeat } from 'lucide-react';
import { format, addDays, startOfDay, addMinutes, isBefore, isAfter, isSameDay } from 'date-fns';
import { useSpecialistCalendar } from '@/hooks/useSpecialistCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatAppointmentSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  specialistId: string;
  userId: string;
  chatSessionId: string;
  onScheduled: () => void;
}

const ChatAppointmentScheduler: React.FC<ChatAppointmentSchedulerProps> = ({
  isOpen,
  onClose,
  specialistId,
  userId,
  chatSessionId,
  onScheduled
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Recurring appointment states
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>('weekly');
  const [occurrences, setOccurrences] = useState<number>(4);
  
  const { toast } = useToast();
  const { checkAvailability, settings } = useSpecialistCalendar({ specialistId });

  // Load appointment types
  useEffect(() => {
    const loadAppointmentTypes = async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true);
      
      if (!error && data) {
        setAppointmentTypes(data);
        if (data.length > 0) {
          setSelectedType(data[0].id);
          setDuration(data[0].default_duration);
        }
      }
    };

    if (isOpen) {
      loadAppointmentTypes();
    }
  }, [isOpen]);

  // Generate available time slots when date changes
  useEffect(() => {
    if (selectedDate && settings) {
      generateAvailableSlots();
    }
  }, [selectedDate, settings]);

  const generateAvailableSlots = async () => {
    if (!selectedDate || !settings) return;

    const slots: string[] = [];
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().slice(0, 3);
    const workingHours = settings.working_hours;
    
    if (workingHours && typeof workingHours === 'object' && dayName in workingHours) {
      const dayHours = (workingHours as any)[dayName];
      if (dayHours && dayHours.start && dayHours.end) {
        const startTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${dayHours.start}`);
        const endTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${dayHours.end}`);
        
        let currentTime = startTime;
        while (isBefore(currentTime, endTime)) {
          const slotEnd = addMinutes(currentTime, duration);
          
          if (isBefore(slotEnd, endTime) || slotEnd.getTime() === endTime.getTime()) {
            const isAvailable = await checkAvailability(currentTime, slotEnd);
            if (isAvailable) {
              slots.push(format(currentTime, 'HH:mm'));
            }
          }
          
          currentTime = addMinutes(currentTime, 30);
        }
      }
    }

    setAvailableSlots(slots);
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const type = appointmentTypes.find(t => t.id === typeId);
    if (type) {
      setDuration(type.default_duration);
      setTitle(type.name);
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedType || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create appointment proposal
      const { data, error } = await supabase
        .from('appointment_proposals')
        .insert({
          specialist_id: specialistId,
          user_id: userId,
          chat_session_id: chatSessionId,
          appointment_type_id: selectedType,
          title: title.trim(),
          description: description.trim() || null,
          start_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime,
          duration,
          frequency: isRecurring ? frequency : 'once',
          occurrences: isRecurring ? occurrences : 1,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment proposal:', error);
        throw error;
      }

      // Create appropriate chat message content
      let messageContent: string;
      let actionType: string;

      if (isRecurring) {
        messageContent = `🗓️ **Recurring Appointment Proposal**\n\n**${title}**\n\n${description}\n\n📅 **Schedule:** ${frequency} starting ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}\n⏱️ **Duration:** ${duration} minutes\n🔄 **Occurrences:** ${occurrences} sessions\n\n*Please respond with "accept" or "reject" to this proposal.*`;
        actionType = 'recurring_appointment_proposal';
      } else {
        messageContent = `I'd like to schedule a ${title} appointment with you on ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}. Please let me know if this works for you!`;
        actionType = 'appointment_proposal';
      }

      // Send chat message with the proposal
      await supabase
        .from('chat_messages')
        .insert({
          session_id: chatSessionId,
          sender_id: specialistId,
          sender_type: 'specialist',
          message_type: 'system',
          content: messageContent,
          metadata: {
            action_type: actionType,
            proposal_id: data.id,
            proposal_data: {
              id: data.id,
              title: data.title,
              description: data.description,
              start_date: data.start_date,
              start_time: data.start_time,
              duration: data.duration.toString(),
              frequency: data.frequency,
              occurrences: data.occurrences.toString()
            }
          }
        });

      toast({
        title: "Appointment Proposed",
        description: `Your ${isRecurring ? 'recurring ' : ''}appointment proposal has been sent to the user`
      });

      onScheduled();
      onClose();
      
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setTitle('');
    setDescription('');
    setAvailableSlots([]);
    setIsRecurring(false);
    setFrequency('weekly');
    setOccurrences(4);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon size={20} />
            Schedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Type Selection */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.default_duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="recurring" className="flex items-center gap-2">
              <Repeat size={16} />
              Recurring Appointment
            </Label>
          </div>

          {/* Recurring Options */}
          {isRecurring && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
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
              <div className="space-y-2">
                <Label>Occurrences</Label>
                <Select value={occurrences.toString()} onValueChange={(value) => setOccurrences(parseInt(value))}>
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
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter appointment title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  isBefore(date, startOfDay(new Date())) || 
                  isAfter(date, addDays(new Date(), settings?.maximum_booking_days || 30))
                }
                className="rounded-md border"
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label>Available Times</Label>
              {selectedDate ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className="justify-start"
                        >
                          <Clock size={14} className="mr-1" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No available slots for this date
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Please select a date first
                </div>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {selectedType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={16} />
              Duration: {duration} minutes
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSchedule}
              disabled={loading || !selectedDate || !selectedTime || !title.trim()}
            >
              {loading ? 'Scheduling...' : 'Send Proposal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatAppointmentScheduler;
