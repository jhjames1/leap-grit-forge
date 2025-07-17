import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { useSpecialistCalendar } from '@/hooks/useSpecialistCalendar';

interface BlockTimeDialogProps {
  specialistId: string;
  onSuccess?: () => void;
}

export function BlockTimeDialog({ specialistId, onSuccess }: BlockTimeDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [exceptionType, setExceptionType] = useState<'unavailable' | 'busy'>('unavailable');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { createAvailabilityException } = useSpecialistCalendar({ specialistId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !startTime || !endDate || !endTime) {
      return;
    }

    setLoading(true);
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (endDateTime <= startDateTime) {
        throw new Error('End time must be after start time');
      }

      await createAvailabilityException(startDateTime, endDateTime, exceptionType, reason);
      setOpen(false);
      onSuccess?.();
      
      // Reset form
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setExceptionType('unavailable');
      setReason('');
    } catch (error) {
      console.error('Error creating time block:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set default dates to today
  const today = new Date().toISOString().split('T')[0];
  const defaultStartDate = startDate || today;
  const defaultEndDate = endDate || today;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MapPin className="w-4 h-4 mr-2" />
          Block Time
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Block Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exception-type">Block Type</Label>
            <Select value={exceptionType} onValueChange={(value: 'unavailable' | 'busy') => setExceptionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select block type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={defaultStartDate}
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
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for blocking this time..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Block Time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}