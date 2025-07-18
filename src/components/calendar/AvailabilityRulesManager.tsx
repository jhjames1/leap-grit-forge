
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Info } from 'lucide-react';

interface AvailabilityRules {
  default_appointment_duration: number;
  buffer_time_minutes: number;
  minimum_notice_hours: number;
  maximum_booking_days: number;
  auto_confirm_bookings: boolean;
  allow_back_to_back_bookings: boolean;
  timezone: string;
}

interface AvailabilityRulesManagerProps {
  specialistId: string;
}

const timezoneOptions = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

const defaultRules: AvailabilityRules = {
  default_appointment_duration: 30,
  buffer_time_minutes: 15,
  minimum_notice_hours: 2,
  maximum_booking_days: 30,
  auto_confirm_bookings: true,
  allow_back_to_back_bookings: false,
  timezone: 'UTC'
};

const AvailabilityRulesManager = ({ specialistId }: AvailabilityRulesManagerProps) => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AvailabilityRules>(defaultRules);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [specialistId]);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_calendar_settings')
        .select('*')
        .eq('specialist_id', specialistId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRules({
          default_appointment_duration: data.default_appointment_duration,
          buffer_time_minutes: data.buffer_time_minutes,
          minimum_notice_hours: data.minimum_notice_hours,
          maximum_booking_days: data.maximum_booking_days,
          auto_confirm_bookings: data.auto_confirm_bookings,
          allow_back_to_back_bookings: data.allow_back_to_back_bookings,
          timezone: data.timezone
        });
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: "Error",
        description: "Failed to load availability rules",
        variant: "destructive"
      });
    }
  };

  const updateRule = <K extends keyof AvailabilityRules>(key: K, value: AvailabilityRules[K]) => {
    setRules(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveRules = async () => {
    setLoading(true);
    try {
      // First try to update existing settings
      const { data: updateData, error: updateError } = await supabase
        .from('specialist_calendar_settings')
        .update(rules)
        .eq('specialist_id', specialistId)
        .select();

      // If no rows were updated (settings don't exist), create them
      if (updateData && updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('specialist_calendar_settings')
          .insert({
            specialist_id: specialistId,
            ...rules
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Availability rules updated successfully"
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving rules:', error);
      toast({
        title: "Error",
        description: "Failed to save availability rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fjalla">Availability Rules</CardTitle>
        <p className="text-sm text-muted-foreground font-source">
          Configure booking policies and appointment settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Appointment Duration */}
          <div className="space-y-2">
            <Label className="font-source">Default Appointment Duration</Label>
            <Select
              value={rules.default_appointment_duration.toString()}
              onValueChange={(value) => updateRule('default_appointment_duration', parseInt(value))}
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
            <p className="text-xs text-muted-foreground">
              Standard length for new appointments
            </p>
          </div>

          {/* Buffer Time */}
          <div className="space-y-2">
            <Label className="font-source">Buffer Time Between Appointments</Label>
            <Select
              value={rules.buffer_time_minutes.toString()}
              onValueChange={(value) => updateRule('buffer_time_minutes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No buffer</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Break time between consecutive appointments
            </p>
          </div>

          {/* Minimum Notice */}
          <div className="space-y-2">
            <Label className="font-source">Minimum Booking Notice</Label>
            <Select
              value={rules.minimum_notice_hours.toString()}
              onValueChange={(value) => updateRule('minimum_notice_hours', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No minimum</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="24">1 day</SelectItem>
                <SelectItem value="48">2 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How far in advance users must book
            </p>
          </div>

          {/* Maximum Booking Window */}
          <div className="space-y-2">
            <Label className="font-source">Maximum Booking Window</Label>
            <Select
              value={rules.maximum_booking_days.toString()}
              onValueChange={(value) => updateRule('maximum_booking_days', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="60">2 months</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How far ahead users can book appointments
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-2 md:col-span-2">
            <Label className="font-source">Timezone</Label>
            <Select
              value={rules.timezone}
              onValueChange={(value) => updateRule('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your local timezone for scheduling
            </p>
          </div>
        </div>

        {/* Booking Policies */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-fjalla font-medium">Booking Policies</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-source">Auto-confirm bookings</Label>
              <p className="text-xs text-muted-foreground">
                Automatically approve new appointment requests
              </p>
            </div>
            <Switch
              checked={rules.auto_confirm_bookings}
              onCheckedChange={(checked) => updateRule('auto_confirm_bookings', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-source">Allow back-to-back bookings</Label>
              <p className="text-xs text-muted-foreground">
                Allow appointments to be scheduled consecutively without buffer time
              </p>
            </div>
            <Switch
              checked={rules.allow_back_to_back_bookings}
              onCheckedChange={(checked) => updateRule('allow_back_to_back_bookings', checked)}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-muted/20 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground font-source">
              <p className="font-medium mb-1">Tips for setting availability rules:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use buffer time to account for notes and preparation between sessions</li>
                <li>• Set minimum notice to ensure you have adequate preparation time</li>
                <li>• Auto-confirm can speed up booking but requires careful schedule management</li>
                <li>• Back-to-back bookings save time but can be intense - use wisely</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={saveRules} 
            disabled={!hasChanges || loading}
            className="min-w-24"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Rules'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityRulesManager;
