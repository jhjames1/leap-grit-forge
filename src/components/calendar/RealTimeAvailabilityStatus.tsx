
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { format, addMinutes, isBefore } from 'date-fns';
import { useCalendarAwarePresence } from '@/hooks/useCalendarAwarePresence';
import { calculateRealTimeAvailability } from '@/utils/calendarAvailability';

interface RealTimeAvailabilityStatusProps {
  specialistId: string;
  showDetails?: boolean;
  className?: string;
}

const RealTimeAvailabilityStatus: React.FC<RealTimeAvailabilityStatusProps> = ({
  specialistId,
  showDetails = true,
  className = ""
}) => {
  const { calendarAvailability, refreshAvailability } = useCalendarAwarePresence(specialistId);
  const [currentStatus, setCurrentStatus] = useState<{
    status: 'online' | 'busy' | 'offline';
    reason?: string;
    nextAvailable?: Date;
    isAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const availability = await calculateRealTimeAvailability(specialistId);
        setCurrentStatus(availability);
      } catch (error) {
        console.error('Error updating real-time status:', error);
      }
    };

    // Initial status check
    updateStatus();

    // Update status every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [specialistId]);

  // Use calendar availability if available, otherwise use current status
  const displayStatus = calendarAvailability || currentStatus;

  if (!displayStatus) {
    return (
      <Badge variant="secondary" className={className}>
        <AlertCircle size={12} className="mr-1" />
        Unknown
      </Badge>
    );
  }

  const getStatusColor = () => {
    if (displayStatus.isAvailable) return 'bg-green-500';
    if (displayStatus.status === 'busy') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (displayStatus.isAvailable) return 'Available';
    if (displayStatus.status === 'busy') return 'Busy';
    return 'Offline';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (displayStatus.isAvailable) return 'default';
    if (displayStatus.status === 'busy') return 'secondary';
    return 'destructive';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getStatusVariant()} className={`cursor-help ${className}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`} />
            {getStatusText()}
            {showDetails && displayStatus.reason && (
              <span className="ml-1 text-xs opacity-75">
                - {displayStatus.reason}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              <span className="font-medium">{getStatusText()}</span>
            </div>
            
            {displayStatus.reason && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle size={14} />
                <span>{displayStatus.reason}</span>
              </div>
            )}
            
            {displayStatus.nextAvailable && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} />
                <span>
                  Next available: {format(displayStatus.nextAvailable, 'MMM d, h:mm a')}
                </span>
              </div>
            )}
            
            {displayStatus.isAvailable && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Calendar size={14} />
                <span>Ready to book appointments</span>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground border-t pt-2">
              Last updated: {format(new Date(), 'h:mm:ss a')}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RealTimeAvailabilityStatus;
