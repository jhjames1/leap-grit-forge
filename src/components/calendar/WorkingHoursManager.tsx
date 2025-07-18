
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, RotateCcw } from 'lucide-react';

interface WorkingDay {
  enabled: boolean;
  start: string;
  end: string;
}

interface WorkingHours {
  monday: WorkingDay;
  tuesday: WorkingDay;
  wednesday: WorkingDay;
  thursday: WorkingDay;
  friday: WorkingDay;
  saturday: WorkingDay;
  sunday: WorkingDay;
}

interface WorkingHoursManagerProps {
  specialistId: string;
}

const defaultWorkingDay: WorkingDay = {
  enabled: false,
  start: '09:00',
  end: '17:00'
};

const defaultWorkingHours: WorkingHours = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: defaultWorkingDay,
  sunday: defaultWorkingDay,
};

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

const dayNames = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const WorkingHoursManager = ({ specialistId }: WorkingHoursManagerProps) => {
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchWorkingHours();
  }, [specialistId]);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_calendar_settings')
        .select('working_hours')
        .eq('specialist_id', specialistId)
        .maybeSingle();

      if (error) throw error;

      if (data?.working_hours) {
        const hours = data.working_hours as any;
        setWorkingHours({
          monday: hours.monday || defaultWorkingDay,
          tuesday: hours.tuesday || defaultWorkingDay,
          wednesday: hours.wednesday || defaultWorkingDay,
          thursday: hours.thursday || defaultWorkingDay,
          friday: hours.friday || defaultWorkingDay,
          saturday: hours.saturday || defaultWorkingDay,
          sunday: hours.sunday || defaultWorkingDay,
        });
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast({
        title: "Error",
        description: "Failed to load working hours",
        variant: "destructive"
      });
    }
  };

  const updateDay = (day: keyof WorkingHours, updates: Partial<WorkingDay>) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
    setHasChanges(true);
  };

  const saveWorkingHours = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('specialist_calendar_settings')
        .upsert({
          specialist_id: specialistId,
          working_hours: workingHours as any
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Working hours updated successfully"
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast({
        title: "Error",
        description: "Failed to save working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setWorkingHours(defaultWorkingHours);
    setHasChanges(true);
  };

  const applyToAllDays = (sourceDay: keyof WorkingHours) => {
    const sourceHours = workingHours[sourceDay];
    const newHours = { ...workingHours };
    
    Object.keys(newHours).forEach(day => {
      newHours[day as keyof WorkingHours] = {
        ...sourceHours,
        enabled: newHours[day as keyof WorkingHours].enabled
      };
    });
    
    setWorkingHours(newHours);
    setHasChanges(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fjalla">Set Your Working Hours</CardTitle>
        <p className="text-sm text-muted-foreground font-source">
          Define when you're available to meet with users during the week
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {Object.entries(dayNames).map(([day, dayName]) => {
            const dayData = workingHours[day as keyof WorkingHours];
            return (
              <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-20">
                    <Switch
                      checked={dayData.enabled}
                      onCheckedChange={(enabled) => updateDay(day as keyof WorkingHours, { enabled })}
                    />
                  </div>
                  <Label className="w-24 font-source font-medium">{dayName}</Label>
                  
                  {dayData.enabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={dayData.start}
                          onValueChange={(start) => updateDay(day as keyof WorkingHours, { start })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map(time => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">to</span>
                        <Select
                          value={dayData.end}
                          onValueChange={(end) => updateDay(day as keyof WorkingHours, { end })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyToAllDays(day as keyof WorkingHours)}
                        className="text-xs"
                      >
                        Apply to all
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveWorkingHours} 
            disabled={!hasChanges || loading}
            className="min-w-24"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkingHoursManager;
