import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, Copy, Clock, RotateCcw, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, addDays, addWeeks, parseISO } from 'date-fns';

interface AppointmentType {
  id: string;
  name: string;
  default_duration: number;
  color: string;
}

interface BulkSchedulingToolsProps {
  specialistId: string;
  onScheduleUpdate: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function BulkSchedulingTools({ specialistId, onScheduleUpdate }: BulkSchedulingToolsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Recurring schedule state
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [bufferTime, setBufferTime] = useState(15);
  const [weeksToApply, setWeeksToApply] = useState(4);
  
  // Copy week state
  const [sourceWeek, setSourceWeek] = useState<string>('');
  const [targetWeeks, setTargetWeeks] = useState<string[]>([]);

  // Fetch appointment types
  const fetchAppointmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('id, name, default_duration, color')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAppointmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment types",
        variant: "destructive"
      });
    }
  };

  // Create recurring schedule
  const createRecurringSchedule = async () => {
    if (!selectedDays.length || !selectedAppointmentType) {
      toast({
        title: "Error",
        description: "Please select days and appointment type",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create schedule entries for each selected day
      const scheduleEntries = selectedDays.map(dayOfWeek => ({
        specialist_id: specialistId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        appointment_type_id: selectedAppointmentType,
        buffer_time_minutes: bufferTime,
        is_recurring: true,
        recurrence_pattern: {
          type: 'weekly',
          interval: 1,
          weeks: weeksToApply
        },
        is_active: true
      }));

      const { error } = await supabase
        .from('specialist_schedules')
        .insert(scheduleEntries);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Recurring schedule created for ${selectedDays.length} days`
      });

      // Reset form
      setSelectedDays([]);
      setSelectedAppointmentType('');
      onScheduleUpdate();
    } catch (error) {
      console.error('Error creating recurring schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create recurring schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy week schedule
  const copyWeekSchedule = async () => {
    if (!sourceWeek || !targetWeeks.length) {
      toast({
        title: "Error",
        description: "Please select source week and target weeks",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get source week schedules
      const sourceWeekStart = startOfWeek(parseISO(sourceWeek));
      const { data: sourceSchedules, error: fetchError } = await supabase
        .from('specialist_schedules')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      // Create new schedules for target weeks
      const newSchedules = [];
      for (const targetWeek of targetWeeks) {
        for (const schedule of sourceSchedules || []) {
          newSchedules.push({
            ...schedule,
            id: undefined, // Remove ID to create new record
            created_at: undefined,
            updated_at: undefined,
          });
        }
      }

      const { error } = await supabase
        .from('specialist_schedules')
        .insert(newSchedules);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Schedule copied to ${targetWeeks.length} week(s)`
      });

      // Reset form
      setSourceWeek('');
      setTargetWeeks([]);
      onScheduleUpdate();
    } catch (error) {
      console.error('Error copying week schedule:', error);
      toast({
        title: "Error",
        description: "Failed to copy schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear all schedules
  const clearAllSchedules = async () => {
    if (!confirm('Are you sure you want to clear all schedules? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('specialist_schedules')
        .update({ is_active: false })
        .eq('specialist_id', specialistId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All schedules cleared"
      });

      onScheduleUpdate();
    } catch (error) {
      console.error('Error clearing schedules:', error);
      toast({
        title: "Error",
        description: "Failed to clear schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle day selection
  const toggleDaySelection = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  // Initialize data
  useEffect(() => {
    fetchAppointmentTypes();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Bulk Scheduling Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recurring" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recurring">Recurring Schedule</TabsTrigger>
            <TabsTrigger value="copy">Copy Week</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => toggleDaySelection(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedDays.map(day => (
                    <Badge key={day} variant="secondary">
                      {DAYS_OF_WEEK.find(d => d.value === day)?.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select value={selectedAppointmentType} onValueChange={setSelectedAppointmentType}>
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
                          {type.name} ({type.default_duration} min)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
                  <Input
                    id="buffer-time"
                    type="number"
                    value={bufferTime}
                    onChange={(e) => setBufferTime(Number(e.target.value))}
                    min="0"
                    step="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeks-apply">Apply for (weeks)</Label>
                  <Input
                    id="weeks-apply"
                    type="number"
                    value={weeksToApply}
                    onChange={(e) => setWeeksToApply(Number(e.target.value))}
                    min="1"
                    max="52"
                  />
                </div>
              </div>

              <Button 
                onClick={createRecurringSchedule}
                disabled={loading || !selectedDays.length || !selectedAppointmentType}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Recurring Schedule
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="copy" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-week">Source Week</Label>
                <Input
                  id="source-week"
                  type="week"
                  value={sourceWeek}
                  onChange={(e) => setSourceWeek(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Weeks</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Select multiple weeks to copy the schedule to
                </div>
                {/* This would need a custom multi-week selector component */}
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  Multi-week selector component needed
                </div>
              </div>

              <Button 
                onClick={copyWeekSchedule}
                disabled={loading || !sourceWeek || !targetWeeks.length}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Week Schedule
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Schedule Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your existing schedules with these bulk operations.
                </p>
                
                <div className="space-y-2">
                  <Button 
                    variant="destructive"
                    onClick={clearAllSchedules}
                    disabled={loading}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear All Schedules
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Quick Templates</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedDays([1, 2, 3, 4, 5]);
                      setStartTime('09:00');
                      setEndTime('17:00');
                      setBufferTime(15);
                    }}
                    className="w-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Standard Business Hours (M-F, 9-5)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedDays([1, 2, 3, 4, 5]);
                      setStartTime('08:00');
                      setEndTime('20:00');
                      setBufferTime(30);
                    }}
                    className="w-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Extended Hours (M-F, 8-8)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedDays([1, 2, 3, 4, 5, 6]);
                      setStartTime('10:00');
                      setEndTime('18:00');
                      setBufferTime(15);
                    }}
                    className="w-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    6-Day Schedule (M-Sat, 10-6)
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}