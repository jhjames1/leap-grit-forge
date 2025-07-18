import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Trash2, Calendar, Clock } from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  appointment_type_id: string;
  appointment_types?: {
    name: string;
    color: string;
  };
  is_active: boolean;
}

interface AvailabilitySlotManagerProps {
  specialistId: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilitySlotManager = ({ specialistId }: AvailabilitySlotManagerProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [specialistId]);

  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_schedules')
        .select(`
          *,
          appointment_types (
            name,
            color
          )
        `)
        .eq('specialist_id', specialistId)
        .eq('is_active', true)
        .order('day_of_week');

      if (error) throw error;

      setSlots(data || []);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      toast({
        title: "Error",
        description: "Failed to load availability slots",
        variant: "destructive"
      });
    }
  };

  const deleteSlot = async (slotId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('specialist_schedules')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability slot deleted successfully"
      });
      
      fetchSlots();
      
      // Trigger calendar refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('calendar-refresh'));
      }, 500);
      
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete availability slot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = async (slotId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('specialist_schedules')
        .update({ is_active: !currentStatus })
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Availability slot ${!currentStatus ? 'activated' : 'deactivated'}`
      });
      
      fetchSlots();
      
      // Trigger calendar refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('calendar-refresh'));
      }, 500);
      
    } catch (error) {
      console.error('Error toggling availability slot:', error);
      toast({
        title: "Error",
        description: "Failed to toggle availability slot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return format(time, 'h:mm a');
  };

  const groupSlotsByDay = () => {
    const grouped: { [key: number]: AvailabilitySlot[] } = {};
    slots.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fjalla flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Manage Availability Slots
        </CardTitle>
        <p className="text-sm text-muted-foreground font-source">
          View, edit, or delete your weekly availability slots
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(groupedSlots).length > 0 ? (
          Object.entries(groupedSlots)
            .sort(([dayA], [dayB]) => parseInt(dayA) - parseInt(dayB))
            .map(([dayOfWeek, daySlots]) => (
              <div key={dayOfWeek} className="space-y-2">
                <h3 className="font-semibold font-source text-lg">
                  {dayNames[parseInt(dayOfWeek)]}
                </h3>
                <div className="space-y-2 pl-4">
                  {daySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium font-source">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              style={{ 
                                backgroundColor: slot.appointment_types?.color + '20',
                                borderColor: slot.appointment_types?.color 
                              }}
                            >
                              {slot.appointment_types?.name || 'Unknown Type'}
                            </Badge>
                            <Badge variant={slot.is_active ? "default" : "secondary"}>
                              {slot.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSlot(slot.id, slot.is_active)}
                          disabled={loading}
                        >
                          {slot.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSlot(slot.id)}
                          disabled={loading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-source">No availability slots found</p>
            <p className="text-sm">Set your working hours first to create availability slots</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilitySlotManager;