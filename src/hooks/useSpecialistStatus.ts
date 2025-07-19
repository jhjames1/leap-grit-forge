import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export type SpecialistStatus = 'online' | 'away' | 'offline' | 'busy';

export const useSpecialistStatus = (specialistId?: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SpecialistStatus>('offline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (newStatus: SpecialistStatus, message?: string) => {
    if (!user || !specialistId) {
      setError('User not authenticated or specialist ID missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Updating specialist status', { 
        specialistId, 
        newStatus, 
        message,
        userId: user.id
      });

      // Verify specialist exists and user has permission
      const { data: specialistCheck, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('id, user_id')
        .eq('id', specialistId)
        .single();

      if (specialistError) {
        throw new Error(`Specialist not found: ${specialistError.message}`);
      }

      if (specialistCheck.user_id !== user.id) {
        throw new Error('Permission denied: You can only update your own status');
      }

      // Update status in database
      const { error: updateError } = await supabase
        .from('specialist_status')
        .upsert({
          specialist_id: specialistId,
          status: newStatus,
          status_message: message || null,
          last_seen: new Date().toISOString(),
          presence_data: {
            manual_override: true,
            timestamp: Date.now()
          }
        }, {
          onConflict: 'specialist_id'
        });

      if (updateError) {
        throw new Error(`Database error: ${updateError.message}`);
      }

      setStatus(newStatus);
      logger.debug('Successfully updated specialist status', { specialistId, newStatus });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      logger.error('Error updating specialist status', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, specialistId]);

  return {
    status,
    loading,
    error,
    updateStatus,
    clearError: () => setError(null)
  };
};