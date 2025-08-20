import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>('weekly');
  const [occurrences, setOccurrences] = useState<number>(4);
  
  const { toast } = useToast();
  const { checkAvailability, settings } = useSpecialistCalendar({ specialistId });

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

  useEffect(() => {
    if (selectedDate && settings) {
      generateAvailableSlots();
    }
  }, [selectedDate, settings]);

  const generateAvailableSlots = async () => {
    if (!selectedDate || !settings) return;

    const slots: string[] = [];
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingHours = settings.working_hours;
    
    console.log('Generating slots for:', { dayName, workingHours, selectedDate });
    
    if (workingHours && typeof workingHours === 'object' && dayName in workingHours) {
      const dayHours = (workingHours as any)[dayName];
      console.log('Day hours found:', dayHours);
      
      if (dayHours && dayHours.start && dayHours.end) {
        const startTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${dayHours.start}`);
        const endTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${dayHours.end}`);
        
        console.log('Working hours:', { startTime, endTime });
        
        let currentTime = startTime;
        while (isBefore(currentTime, endTime)) {
          const slotEnd = addMinutes(currentTime, duration);
          
          if (isBefore(slotEnd, endTime) || slotEnd.getTime() === endTime.getTime()) {
            console.log('Checking availability for slot:', format(currentTime, 'HH:mm'));
            const isAvailable = await checkAvailability(currentTime, slotEnd);
            console.log('Slot availability:', { time: format(currentTime, 'HH:mm'), isAvailable });
            
            if (isAvailable) {
              slots.push(format(currentTime, 'HH:mm'));
            }
          }
          
          currentTime = addMinutes(currentTime, 30);
        }
      }
    } else {
      console.log('No working hours found for day:', dayName);
    }

    console.log('Generated slots:', slots);
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
    console.log('Starting appointment scheduling...', {
      selectedDate,
      selectedTime,
      selectedType,
      title,
      specialistId,
      userId,
      chatSessionId
    });

    try {
      // Create appointment proposal with Central Time conversion
      // Convert selected time from Central to UTC for storage
      const centralDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
      // Assuming Central Time is UTC-6 (CST) or UTC-5 (CDT), add 6 hours to get UTC
      const utcDateTime = new Date(centralDateTime.getTime() + (6 * 60 * 60 * 1000));
      
      console.log('Creating appointment proposal...', {
        selectedLocalTime: selectedTime,
        centralDateTime: centralDateTime.toISOString(),
        utcDateTime: utcDateTime.toISOString(),
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
      });
      
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
          start_time: selectedTime, // Store the original Central Time
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

      console.log('Appointment proposal created successfully:', data);

      // Send chat message with the proposal
      console.log('Sending chat message...');
      
      // Get the current user's ID (the specialist)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const recurringText = isRecurring 
        ? ` This will be a ${frequency} recurring appointment for ${occurrences} sessions.`
        : '';
      
      const messageResult = await supabase
        .from('chat_messages')
        .insert({
          session_id: chatSessionId,
          sender_id: currentUser.id,
          sender_type: 'specialist',
          message_type: 'system',
          content: `I'd like to schedule a ${title} appointment with you on ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}.${recurringText} Please let me know if this works for you!`,
          metadata: {
            action_type: 'appointment_proposal',
            proposal_id: data.id,
            proposal_data: {
              id: data.id,
              title: data.title,
              description: data.description,
              start_date: data.start_date,
              start_time: data.start_time,
              duration: data.duration.toString(),
              frequency: data.frequency,
              occurrences: data.occurrences.toString(),
              specialist_id: data.specialist_id,
              user_id: data.user_id,
              is_recurring: isRecurring
            }
          }
        });

      if (messageResult.error) {
        console.error('Error sending chat message:', messageResult.error);
        throw messageResult.error;
      }

      console.log('Chat message sent successfully:', messageResult);

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
        title: "Appointment Proposed",
        description: "Your appointment proposal has been sent to the user"
      });

      onScheduled();
      onClose();
      
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: `Failed to schedule appointment: ${error.message || 'Unknown error'}`,
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

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter appointment title"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="recurring" className="flex items-center gap-2">
                <Repeat size={16} />
                Recurring Appointment
              </Label>
            </div>
            
            {isRecurring && (
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Number of Sessions</Label>
                  <Select value={occurrences.toString()} onValueChange={(value) => setOccurrences(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} sessions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {selectedType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={16} />
              Duration: {duration} minutes
            </div>
          )}

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
