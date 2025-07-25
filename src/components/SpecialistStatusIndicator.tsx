import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Circle, Clock, AlertCircle, Wifi, WifiOff, RotateCcw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpecialistStatusIndicatorProps {
  specialistId: string;
  initialStatus?: 'online' | 'offline' | 'busy';
}

const SpecialistStatusIndicator = ({ 
  specialistId, 
  initialStatus = 'offline' 
}: SpecialistStatusIndicatorProps) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>(initialStatus);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [manualResetTimer, setManualResetTimer] = useState<number | null>(null);
  const [lastCalendarCheck, setLastCalendarCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  // Status configuration
  const statusConfig = {
    online: {
      label: 'Online',
      icon: Circle,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      description: 'Available for sessions'
    },
    busy: {
      label: 'Busy',
      icon: Clock,
      color: 'text-yellow-500', 
      bgColor: 'bg-yellow-100',
      description: 'In session or unavailable'
    },
    offline: {
      label: 'Offline',
      icon: AlertCircle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      description: 'Not available'
    }
  };

  // Update status in database
  const updateStatus = useCallback(async (newStatus: 'online' | 'offline' | 'busy', isManual = false) => {
    try {
      const statusMessage = statusConfig[newStatus].description;
      
      const { error } = await supabase
        .from('specialist_status')
        .upsert({
          specialist_id: specialistId,
          status: newStatus,
          status_message: statusMessage,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'specialist_id' 
        });

      if (error) throw error;

      setStatus(newStatus);
      setIsManualOverride(isManual);
      
      if (isManual) {
        toast({
          title: "Status Updated",
          description: `You are now ${statusConfig[newStatus].label.toLowerCase()}`,
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  }, [specialistId, toast]);

  // Reset to calendar-based status
  const resetToCalendar = useCallback(async () => {
    try {
      setIsManualOverride(false);
      if (manualResetTimer) {
        clearTimeout(manualResetTimer);
        setManualResetTimer(null);
      }
      
      await checkCalendarStatus(true); // Force calendar check
      
      toast({
        title: "Status Reset",
        description: "Status reset to calendar-based availability",
      });
    } catch (error) {
      console.error('Failed to reset status:', error);
      toast({
        title: "Error",
        description: "Failed to reset status",
        variant: "destructive"
      });
    }
  }, [manualResetTimer, toast]);

  // Check calendar for automatic status updates
  const checkCalendarStatus = useCallback(async (forceCheck = false) => {
    if (isManualOverride && !forceCheck) return; // Don't auto-update if manually set
    
    try {
      const now = new Date();
      setLastCalendarCheck(now);
      
      // Check if specialist has an active appointment right now
      const { data: currentAppointment } = await supabase
        .from('specialist_appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('status', 'in_progress')
        .lte('scheduled_start', now.toISOString())
        .gte('scheduled_end', now.toISOString())
        .maybeSingle();

      // Check if specialist has upcoming appointment in next 15 minutes
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);
      const { data: upcomingAppointment } = await supabase
        .from('specialist_appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_start', now.toISOString())
        .lte('scheduled_start', fifteenMinutesLater.toISOString())
        .maybeSingle();

      // Check availability exceptions (blocked times)
      const { data: exception } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('exception_type', 'unavailable')
        .lte('start_time', now.toISOString())
        .gte('end_time', now.toISOString())
        .maybeSingle();

      // Determine status based on calendar
      let newStatus: 'online' | 'offline' | 'busy' = 'offline';
      
      if (currentAppointment || exception) {
        newStatus = 'busy';
      } else {
        // Check if within working hours
        const { data: settings } = await supabase
          .from('specialist_calendar_settings')
          .select('working_hours')
          .eq('specialist_id', specialistId)
          .maybeSingle();

        if (settings?.working_hours) {
          const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const daySchedule = settings.working_hours[dayName];
          
          if (daySchedule?.enabled) {
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
            if (currentTime >= daySchedule.start && currentTime <= daySchedule.end) {
              newStatus = upcomingAppointment ? 'busy' : 'online';
            }
          }
        }
      }

      if (newStatus !== status) {
        updateStatus(newStatus, false);
      }
    } catch (error) {
      console.error('Error checking calendar status:', error);
    }
  }, [specialistId, status, isManualOverride, updateStatus]);

  // Manual status change
  const handleManualStatusChange = (newStatus: 'online' | 'offline' | 'busy') => {
    updateStatus(newStatus, true);
    
    // Set 30-minute timer for auto-reset
    if (manualResetTimer) {
      clearTimeout(manualResetTimer);
    }
    
    const timer = window.setTimeout(() => {
      setIsManualOverride(false);
      checkCalendarStatus(true);
      toast({
        title: "Status Auto-Reset",
        description: "Manual status override expired, returning to calendar-based status",
      });
    }, 30 * 60 * 1000); // 30 minutes
    
    setManualResetTimer(timer);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (manualResetTimer) {
        clearTimeout(manualResetTimer);
      }
    };
  }, [manualResetTimer]);

  // Check calendar status periodically
  useEffect(() => {
    checkCalendarStatus(); // Check immediately
    
    const interval = setInterval(checkCalendarStatus, 2 * 60 * 1000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, [checkCalendarStatus]);

  // Real-time updates for calendar changes
  useEffect(() => {
    const channel = supabase
      .channel('specialist-calendar-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'specialist_appointments',
        filter: `specialist_id=eq.${specialistId}`
      }, () => {
        checkCalendarStatus();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'specialist_availability_exceptions',
        filter: `specialist_id=eq.${specialistId}`
      }, () => {
        checkCalendarStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [specialistId, checkCalendarStatus]);

  const config = statusConfig[status];
  const IconComponent = config.icon;

  // Get readable time for last calendar check
  const getTimeSinceLastCheck = () => {
    if (!lastCalendarCheck) return 'Never';
    const minutes = Math.floor((Date.now() - lastCalendarCheck.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <IconComponent className={`w-4 h-4 ${config.color}`} />
          <span>{config.label}</span>
          {isManualOverride && (
            <Badge variant="secondary" className="text-xs px-1">
              Manual
            </Badge>
          )}
          {!isManualOverride && (
            <Calendar className="w-3 h-3 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Status info header */}
        <div className="px-2 py-2 text-xs text-muted-foreground border-b">
          {isManualOverride ? (
            <div className="flex items-center gap-1">
              <Circle className="w-3 h-3 fill-orange-500 text-orange-500" />
              Manual override active
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Calendar-based • Updated {getTimeSinceLastCheck()}
            </div>
          )}
        </div>

        {/* Manual status options */}
        <DropdownMenuItem onClick={() => handleManualStatusChange('online')}>
          <Circle className="w-4 h-4 text-green-500 mr-2" />
          <div>
            <div className="font-medium">Online</div>
            <div className="text-xs text-muted-foreground">Available for sessions</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleManualStatusChange('busy')}>
          <Clock className="w-4 h-4 text-yellow-500 mr-2" />
          <div>
            <div className="font-medium">Busy</div>
            <div className="text-xs text-muted-foreground">In session or unavailable</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleManualStatusChange('offline')}>
          <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
          <div>
            <div className="font-medium">Offline</div>
            <div className="text-xs text-muted-foreground">Not available</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Reset options */}
        <DropdownMenuItem onClick={resetToCalendar}>
          <RotateCcw className="w-4 h-4 text-blue-500 mr-2" />
          <div>
            <div className="font-medium">Reset to Calendar</div>
            <div className="text-xs text-muted-foreground">Clear manual override</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SpecialistStatusIndicator;