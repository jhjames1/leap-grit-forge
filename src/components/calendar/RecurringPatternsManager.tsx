import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Calendar, RotateCcw } from 'lucide-react';

interface RecurringPattern {
  id?: string;
  name: string;
  pattern_type: 'weekly' | 'biweekly' | 'monthly';
  days_of_week: number[];
  start_time: string;
  end_time: string;
  exception_type: 'unavailable' | 'available';
  reason?: string;
  is_active: boolean;
}

interface RecurringPatternsManagerProps {
  specialistId: string;
}

const dayOptions = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  const display = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return { value: time, label: display };
});

const patternPresets = [
  {
    name: 'Lunch Break (Weekdays)',
    pattern_type: 'weekly' as const,
    days_of_week: [1, 2, 3, 4, 5],
    start_time: '12:00',
    end_time: '13:00',
    exception_type: 'unavailable' as const,
    reason: 'Lunch break'
  },
  {
    name: 'Team Meeting (Mondays)',
    pattern_type: 'weekly' as const,
    days_of_week: [1],
    start_time: '09:00',
    end_time: '10:00',
    exception_type: 'unavailable' as const,
    reason: 'Team meeting'
  },
  {
    name: 'Weekend Availability',
    pattern_type: 'weekly' as const,
    days_of_week: [0, 6],
    start_time: '10:00',
    end_time: '16:00',
    exception_type: 'available' as const,
    reason: 'Weekend hours'
  },
];

const RecurringPatternsManager = ({ specialistId }: RecurringPatternsManagerProps) => {
  const { toast } = useToast();
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewPatternForm, setShowNewPatternForm] = useState(false);
  const [newPattern, setNewPattern] = useState<Partial<RecurringPattern>>({
    pattern_type: 'weekly',
    days_of_week: [],
    exception_type: 'unavailable',
    is_active: true
  });

  useEffect(() => {
    fetchPatterns();
  }, [specialistId]);

  const fetchPatterns = async () => {
    try {
      // For this demo, we'll store recurring patterns in the availability_exceptions table
      // with a special marker in the reason field and is_recurring = true
      const { data, error } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_recurring', true)
        .order('created_at');

      if (error) throw error;

      // Transform the data to match our RecurringPattern interface
      const transformedPatterns = (data || []).map(item => ({
        id: item.id,
        name: item.reason || 'Unnamed Pattern',
        pattern_type: 'weekly' as const, // Default for now
        days_of_week: [], // Would need to parse from recurrence_pattern
        start_time: new Date(item.start_time).toTimeString().slice(0, 5),
        end_time: new Date(item.end_time).toTimeString().slice(0, 5),
        exception_type: item.exception_type as 'unavailable' | 'available',
        reason: item.reason,
        is_active: true
      }));

      setPatterns(transformedPatterns);
    } catch (error) {
      console.error('Error fetching patterns:', error);
      toast({
        title: "Error",
        description: "Failed to load recurring patterns",
        variant: "destructive"
      });
    }
  };

  const createPattern = async (patternData: Partial<RecurringPattern>) => {
    if (!patternData.name || !patternData.days_of_week?.length || !patternData.start_time || !patternData.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create a sample date to work with times
      const today = new Date();
      const startTime = new Date(today);
      const [startHour, startMinute] = patternData.start_time!.split(':');
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const endTime = new Date(today);
      const [endHour, endMinute] = patternData.end_time!.split(':');
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const { error } = await supabase
        .from('specialist_availability_exceptions')
        .insert({
          specialist_id: specialistId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reason: patternData.name,
          exception_type: patternData.exception_type || 'unavailable',
          is_recurring: true,
          recurrence_pattern: {
            type: patternData.pattern_type,
            days_of_week: patternData.days_of_week
          }
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring pattern created successfully"
      });

      setNewPattern({
        pattern_type: 'weekly',
        days_of_week: [],
        exception_type: 'unavailable',
        is_active: true
      });
      setShowNewPatternForm(false);
      fetchPatterns();
    } catch (error) {
      console.error('Error creating pattern:', error);
      toast({
        title: "Error",
        description: "Failed to create recurring pattern",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePattern = async (patternId: string) => {
    try {
      const { error } = await supabase
        .from('specialist_availability_exceptions')
        .delete()
        .eq('id', patternId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring pattern deleted successfully"
      });
      fetchPatterns();
    } catch (error) {
      console.error('Error deleting pattern:', error);
      toast({
        title: "Error",
        description: "Failed to delete recurring pattern",
        variant: "destructive"
      });
    }
  };

  const createPresetPattern = (preset: typeof patternPresets[0]) => {
    createPattern({
      ...preset,
      is_active: true
    });
  };

  const updateDaySelection = (day: number, checked: boolean) => {
    const currentDays = newPattern.days_of_week || [];
    const updatedDays = checked 
      ? [...currentDays, day].sort()
      : currentDays.filter(d => d !== day);
    
    setNewPattern({ ...newPattern, days_of_week: updatedDays });
  };

  const formatDays = (days: number[]) => {
    return days.map(day => dayOptions.find(opt => opt.value === day)?.short).join(', ');
  };

  const formatTime = (time: string) => {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-fjalla">Recurring Patterns</CardTitle>
          <p className="text-sm text-muted-foreground font-source">
            Set up repeating availability and unavailability patterns
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Patterns */}
          <div>
            <Label className="font-source mb-2 block">Quick Patterns:</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {patternPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => createPresetPattern(preset)}
                  className="justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDays(preset.days_of_week)} • {formatTime(preset.start_time)}-{formatTime(preset.end_time)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Add Custom Pattern Button */}
          <Button
            onClick={() => setShowNewPatternForm(!showNewPatternForm)}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Recurring Pattern
          </Button>

          {/* New Pattern Form */}
          {showNewPatternForm && (
            <Card className="p-4 bg-muted/20">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-source">Pattern Name</Label>
                    <Input
                      placeholder="e.g., Weekly team meeting"
                      value={newPattern.name || ''}
                      onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-source">Pattern Type</Label>
                    <Select
                      value={newPattern.pattern_type}
                      onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => 
                        setNewPattern({ ...newPattern, pattern_type: value })
                      }
                    >
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

                <div>
                  <Label className="font-source mb-2 block">Days of Week</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {dayOptions.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={(newPattern.days_of_week || []).includes(day.value)}
                          onCheckedChange={(checked) => updateDaySelection(day.value, !!checked)}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm font-source">
                          {day.short}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="font-source">Start Time</Label>
                    <Select
                      value={newPattern.start_time}
                      onValueChange={(value) => setNewPattern({ ...newPattern, start_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-source">End Time</Label>
                    <Select
                      value={newPattern.end_time}
                      onValueChange={(value) => setNewPattern({ ...newPattern, end_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-source">Type</Label>
                    <Select
                      value={newPattern.exception_type}
                      onValueChange={(value: 'unavailable' | 'available') => 
                        setNewPattern({ ...newPattern, exception_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-source">Reason (Optional)</Label>
                  <Input
                    placeholder="Meeting, personal time, etc."
                    value={newPattern.reason || ''}
                    onChange={(e) => setNewPattern({ ...newPattern, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowNewPatternForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createPattern(newPattern)} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Pattern'}
                </Button>
              </div>
            </Card>
          )}

          {/* Existing Patterns */}
          <div>
            <Label className="font-source mb-2 block">Active Recurring Patterns:</Label>
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium font-source">{pattern.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pattern.pattern_type} • {formatTime(pattern.start_time)}-{formatTime(pattern.end_time)}
                          <span className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                            {pattern.exception_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => pattern.id && deletePattern(pattern.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm font-source">
                No recurring patterns configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecurringPatternsManager;
