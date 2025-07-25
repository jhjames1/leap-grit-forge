import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Hook to periodically update specialist statuses based on their schedules
 * This ensures statuses stay current even when no database changes trigger updates
 */
export function useSpecialistStatusScheduler() {
  const intervalRef = useRef<NodeJS.Timeout>();

  const updateSpecialistStatuses = async () => {
    try {
      logger.info('Running periodic specialist status update');
      
      // Call the database function to update all specialist statuses
      const { error } = await supabase.rpc('update_specialist_status_from_calendar_schedule');
      
      if (error) {
        logger.error('Error updating specialist statuses:', error);
      } else {
        logger.info('Specialist statuses updated successfully');
      }
    } catch (error) {
      logger.error('Failed to update specialist statuses:', error);
    }
  };

  useEffect(() => {
    // Update statuses immediately when hook mounts
    updateSpecialistStatuses();
    
    // Set up periodic updates every 2 minutes
    intervalRef.current = setInterval(updateSpecialistStatuses, 2 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Expose manual update function for testing or forced updates
  return {
    updateNow: updateSpecialistStatuses
  };
}