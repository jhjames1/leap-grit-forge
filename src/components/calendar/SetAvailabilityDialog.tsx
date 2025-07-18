import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useSpecialistCalendar } from '@/hooks/useSpecialistCalendar';

interface SetAvailabilityDialogProps {
  specialistId: string;
  appointmentTypes: Array<{
    id: string;
    name: string;
    default_duration: number;
    color: string;
  }>;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export function SetAvailabilityDialog({ specialistId, appointmentTypes, onSuccess }: SetAvailabilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [bufferTime, setBufferTime] = useState(15);
  const [loading, setLoading] = useState(false);

  const { createAvailabilityBlock } = useSpecialistCalendar({ specialistId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentTypeId) {
      return;
    }

    setLoading(true);
    
    try {
      await createAvailabilityBlock(dayOfWeek, startTime, endTime, appointmentTypeId, bufferTime);
      setOpen(false);
      onSuccess?.();
      
      // Reset form
      setDayOfWeek(1);
      setStartTime('09:00');
      setEndTime('17:00');
      setAppointmentTypeId('');
      setBufferTime(15);
    } catch (error) {
      console.error('Error creating availability:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Set Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Availability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="day">Day of Week</Label>
            <Select value={dayOfWeek.toString()} onValueChange={(value) => setDayOfWeek(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-type">Appointment Type</Label>
            <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
            <Input
              id="buffer-time"
              type="number"
              min="0"
              max="60"
              value={bufferTime}
              onChange={(e) => setBufferTime(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !appointmentTypeId}>
              {loading ? 'Creating...' : 'Create Availability'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}