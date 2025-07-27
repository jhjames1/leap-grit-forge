import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from './pushNotificationService';
import { logger } from '@/utils/logger';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notification using the best available method
   */
  public async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Check if user is subscribed to push notifications
      const isPushSubscribed = await pushNotificationService.isSubscribed();
      
      if (isPushSubscribed) {
        // Send push notification (works even when app is closed)
        await this.sendPushNotification(payload);
      } else if (this.isBrowserNotificationAvailable()) {
        // Fallback to browser notification (only works when app is open)
        await this.sendBrowserNotification(payload);
      } else {
        // Log that no notification method is available
        logger.warn('No notification method available for payload:', payload);
      }
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }
  }

  /**
   * Send push notification to current user
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          icon: payload.icon,
          badge: payload.badge,
          actions: payload.actions
        }
      });

      if (error) {
        throw error;
      }

      logger.debug('Push notification sent successfully');
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Send browser notification (fallback)
   */
  private async sendBrowserNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Browser notification permission denied');
        }
      }

      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge,
        data: payload.data
      });

      // Auto-close after 5 seconds for browser notifications
      setTimeout(() => {
        notification.close();
      }, 5000);

      logger.debug('Browser notification sent successfully');
    } catch (error) {
      logger.error('Failed to send browser notification:', error);
      throw error;
    }
  }

  /**
   * Check if browser notifications are available
   */
  private isBrowserNotificationAvailable(): boolean {
    return 'Notification' in window;
  }

  /**
   * Send notification to specific user (admin use)
   */
  public async sendNotificationToUser(
    userId: string, 
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          icon: payload.icon,
          badge: payload.badge,
          actions: payload.actions
        }
      });

      if (error) {
        throw error;
      }

      logger.debug('Notification sent to user:', userId);
    } catch (error) {
      logger.error('Failed to send notification to user:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      // Try push notifications first
      const pushSubscribed = await pushNotificationService.subscribe();
      if (pushSubscribed) {
        return true;
      }

      // Fallback to browser notifications
      if (this.isBrowserNotificationAvailable()) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }

      return false;
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();