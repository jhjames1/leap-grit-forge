import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Trash2, Save, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AppointmentData {
  id: string;
  specialist_id: string;
  user_id: string;
  appointment_type_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_type?: string;
  notes?: string;
  appointment_types?: {
    name: string;
    color: string;
    default_duration: number;
  };
}

interface AppointmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentData | null;
  onUpdated: () => void;
}

interface AppointmentType {
  id: string;
  name: string;
  default_duration: number;
  color: string;
}

const AppointmentEditDialog = ({ isOpen, onClose, appointment, onUpdated }: AppointmentEditDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    start_date: new Date(),
    start_time: '',
    duration: 60,
    appointment_type_id: '',
    status: 'scheduled',
    meeting_type: 'chat',
    notes: ''
  });
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{name: string; email: string} | null>(null);
  const { toast } = useToast();

  // Load appointment types
  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setAppointmentTypes(data);
      }
    };

    fetchAppointmentTypes();
  }, []);

  // Populate form when appointment changes
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.scheduled_start);
      const endDate = new Date(appointment.scheduled_end);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

      setFormData({
        title: appointment.appointment_types?.name || 'Appointment',
        start_date: startDate,
        start_time: format(startDate, 'HH:mm'),
        duration,
        appointment_type_id: appointment.appointment_type_id,
        status: appointment.status,
        meeting_type: appointment.meeting_type || 'chat',
        notes: appointment.notes || ''
      });

      // Fetch user information
      fetchUserInfo(appointment.user_id);
    }
  }, [appointment]);

  const fetchUserInfo = async (userId: string) => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .single();

      // Get user email from auth
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (profile && user) {
        setUserInfo({
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleSave = async () => {
    if (!appointment) return;

    setLoading(true);
    try {
      const startDateTime = new Date(formData.start_date);
      const [hours, minutes] = formData.start_time.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + formData.duration);

      // Update specialist_appointments table
      const { error: specialistError } = await supabase
        .from('specialist_appointments')
        .update({
          appointment_type_id: formData.appointment_type_id,
          scheduled_start: startDateTime.toISOString(),
          scheduled_end: endDateTime.toISOString(),
          status: formData.status,
          meeting_type: formData.meeting_type,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (specialistError) throw specialistError;

      // Also update scheduled_appointments table if it exists
      const { error: scheduledError } = await supabase
        .from('scheduled_appointments')
        .update({
          appointment_type_id: formData.appointment_type_id,
          scheduled_start: startDateTime.toISOString(),
          scheduled_end: endDateTime.toISOString(),
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('specialist_id', appointment.specialist_id)
        .eq('user_id', appointment.user_id)
        .eq('scheduled_start', appointment.scheduled_start);

      // Don't throw error if scheduled appointment doesn't exist
      if (scheduledError) {
        console.warn('Could not update scheduled_appointments:', scheduledError);
      }

      toast({
        title: "Appointment Updated",
        description: "The appointment has been successfully updated.",
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    setLoading(true);
    try {
      // Delete from specialist_appointments
      const { error: specialistError } = await supabase
        .from('specialist_appointments')
        .delete()
        .eq('id', appointment.id);

      if (specialistError) throw specialistError;

      // Also delete from scheduled_appointments if it exists
      const { error: scheduledError } = await supabase
        .from('scheduled_appointments')
        .delete()
        .eq('specialist_id', appointment.specialist_id)
        .eq('user_id', appointment.user_id)
        .eq('scheduled_start', appointment.scheduled_start);

      // Don't throw error if scheduled appointment doesn't exist
      if (scheduledError) {
        console.warn('Could not delete scheduled_appointments:', scheduledError);
      }

      toast({
        title: "Appointment Deleted",
        description: "The appointment has been successfully deleted.",
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = appointmentTypes.find(t => t.id === typeId);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        appointment_type_id: typeId,
        duration: selectedType.default_duration,
        title: selectedType.name
      }));
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Edit Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Appointment Details
            </h4>
            {userInfo && (
              <div className="text-sm space-y-1">
                <p><strong>Client:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Current Status:</strong> <Badge variant="outline">{appointment.status}</Badge></p>
              </div>
            )}
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="appointment-type">Appointment Type</Label>
            <Select value={formData.appointment_type_id} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name} ({type.default_duration}min)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.start_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <div className="flex gap-2">
                <Input
                  id="start-time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
                <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {formData.duration}min
                </div>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select 
              value={formData.duration.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label htmlFor="meeting-type">Meeting Type</Label>
            <Select value={formData.meeting_type} onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">Chat Session</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this appointment..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Warning about peer calendar sync */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Peer Calendar Sync</p>
                <p>Changes to this appointment will automatically update both the specialist and peer calendars.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Appointment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this appointment? This action cannot be undone and will remove the appointment from both specialist and peer calendars.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={loading}>
                    {loading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentEditDialog;