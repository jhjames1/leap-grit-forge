
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Users, X, Plus, AlertCircle } from 'lucide-react';
import { format, addDays, startOfDay, addMinutes, isBefore, isAfter, isSameDay, endOfDay } from 'date-fns';
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
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const { settings, getAvailabilitySlots, availabilitySlots } = useSpecialistCalendar({ specialistId });

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
  }, [selectedDate, settings, getAvailabilitySlots]);

  const generateAvailableSlots = async () => {
    if (!selectedDate || !settings) return;

    setSlotsLoading(true);
    try {
      // Get availability slots for the selected date
      const startOfSelectedDate = startOfDay(selectedDate);
      const endOfSelectedDate = endOfDay(selectedDate);
      
      await getAvailabilitySlots(startOfSelectedDate, endOfSelectedDate);
      
      // Filter slots for the selected date and extract available times
      const daySlots = availabilitySlots.filter(slot => 
        isSameDay(slot.start, selectedDate) && slot.isAvailable
      );
      
      const timeSlots = daySlots.map(slot => format(slot.start, 'HH:mm'));
      setAvailableSlots(timeSlots);

      // Find next available time if no slots today
      if (timeSlots.length === 0) {
        findNextAvailableTime();
      } else {
        setNextAvailableTime(null);
      }
    } catch (error) {
      console.error('Error generating available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive"
      });
    } finally {
      setSlotsLoading(false);
    }
  };

  const findNextAvailableTime = async () => {
    if (!settings) return;

    try {
      // Look for available slots in the next 30 days
      const today = new Date();
      const futureDate = addDays(today, settings.maximum_booking_days || 30);
      
      await getAvailabilitySlots(today, futureDate);
      
      const nextSlot = availabilitySlots.find(slot => 
        slot.isAvailable && isAfter(slot.start, new Date())
      );
      
      setNextAvailableTime(nextSlot?.start || null);
    } catch (error) {
      console.error('Error finding next available time:', error);
    }
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
      const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
      
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
          frequency: 'once',
          occurrences: 1,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment proposal:', error);
        throw error;
      }

      // Send chat message with the proposal
      await supabase
        .from('chat_messages')
        .insert({
          session_id: chatSessionId,
          sender_id: specialistId,
          sender_type: 'specialist',
          message_type: 'system',
          content: `I'd like to schedule a ${title} appointment with you on ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}. Please let me know if this works for you!`,
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
              occurrences: data.occurrences.toString()
            }
          }
        });

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
    setNextAvailableTime(null);
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
                  {slotsLoading ? (
                    <div className="text-center text-muted-foreground py-4">
                      <Clock size={16} className="animate-spin mx-auto mb-2" />
                      Loading available times...
                    </div>
                  ) : availableSlots.length > 0 ? (
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
                    <div className="space-y-3">
                      <div className="text-center text-muted-foreground py-4">
                        <AlertCircle size={16} className="mx-auto mb-2 text-amber-500" />
                        No available slots for this date
                      </div>
                      {nextAvailableTime && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-700 mb-2">
                            <strong>Next available:</strong>
                          </p>
                          <p className="text-sm text-blue-600">
                            {format(nextAvailableTime, 'EEEE, MMMM d, yyyy')} at{' '}
                            {format(nextAvailableTime, 'h:mm a')}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => {
                              setSelectedDate(nextAvailableTime);
                              setSelectedTime(format(nextAvailableTime, 'HH:mm'));
                            }}
                          >
                            Select this time
                          </Button>
                        </div>
                      )}
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
              {settings && (
                <span className="ml-4">
                  • Buffer time: {settings.buffer_time_minutes} minutes
                </span>
              )}
            </div>
          )}

          {/* Working Hours Info */}
          {settings && selectedDate && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Working hours for {format(selectedDate, 'EEEE')}:</strong>
                {(() => {
                  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const workingHours = settings.working_hours as any;
                  const dayHours = workingHours?.[dayName];
                  return dayHours ? ` ${dayHours.start} - ${dayHours.end}` : ' Not available';
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum notice: {settings.minimum_notice_hours} hours
              </p>
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
