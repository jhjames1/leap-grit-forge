import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { audioNotification } from '@/utils/audioNotification';
import { logger } from '@/utils/logger';

interface AudioNotificationSettings {
  audioNotifications: boolean;
  audioNotificationVolume: number;
}

export const useAudioNotifications = (specialistId: string | null) => {
  const [settings, setSettings] = useState<AudioNotificationSettings>({
    audioNotifications: false,
    audioNotificationVolume: 0.3
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load audio notification settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!specialistId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('specialist_calendar_settings')
          .select('notification_preferences')
          .eq('specialist_id', specialistId)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data?.notification_preferences) {
          const prefs = data.notification_preferences as any;
          setSettings({
            audioNotifications: prefs.audioNotifications || false,
            audioNotificationVolume: prefs.audioNotificationVolume || 0.3
          });
        }
      } catch (error) {
        logger.error('Error loading audio notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [specialistId]);

  // Play notification if enabled
  const playNewSessionNotification = () => {
    if (!settings.audioNotifications) {
      logger.debug('Audio notifications disabled, skipping sound');
      return;
    }

    try {
      // Set the volume before playing
      const originalVolume = settings.audioNotificationVolume;
      
      // Play two-tone notification with custom volume
      audioNotification.playNotificationBeep(600, 150, originalVolume);
      setTimeout(() => {
        audioNotification.playNotificationBeep(800, 150, originalVolume);
      }, 100);
      
      logger.debug('New session audio notification played');
    } catch (error) {
      logger.error('Failed to play audio notification:', error);
    }
  };

  return {
    settings,
    isLoading,
    playNewSessionNotification
  };
};