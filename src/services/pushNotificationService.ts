import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: globalThis.PushSubscription | null = null;

  private constructor() {
    this.initializeServiceWorker();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      logger.warn('Push notifications not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      logger.debug('Service worker ready for push notifications');
    } catch (error) {
      logger.error('Failed to initialize service worker', error);
    }
  }

  /**
   * Request permission and subscribe to push notifications
   */
  public async subscribe(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('PushManager' in window)) {
        toast({
          title: 'Not Supported',
          description: 'Push notifications are not supported in this browser',
          variant: 'destructive'
        });
        return false;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive'
        });
        return false;
      }

      // Wait for service worker
      if (!this.registration) {
        await this.initializeServiceWorker();
      }

      if (!this.registration) {
        throw new Error('Service worker not available');
      }

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM-TnQV4aDOcdJZQVgQXs0xkZ_8eLQJSRXagjR1Bp5Y1lxVGMlXYNw'
        )
      });

      // Save subscription to database
      await this.saveSubscription();

      toast({
        title: 'Notifications Enabled',
        description: 'You will receive push notifications for important updates'
      });

      logger.debug('Push notification subscription successful');
      return true;

    } catch (error) {
      logger.error('Failed to subscribe to push notifications', error);
      toast({
        title: 'Subscription Failed',
        description: 'Could not enable push notifications. Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true;
      }

      await this.subscription.unsubscribe();
      await this.removeSubscription();
      this.subscription = null;

      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications'
      });

      logger.debug('Push notification unsubscription successful');
      return true;

    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications', error);
      return false;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  public async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        await this.initializeServiceWorker();
      }

      if (!this.registration) {
        return false;
      }

      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription !== null;

    } catch (error) {
      logger.error('Failed to check subscription status', error);
      return false;
    }
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(): Promise<void> {
    if (!this.subscription) {
      throw new Error('No subscription to save');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const subscriptionData = {
      user_id: user.id,
      endpoint: this.subscription.endpoint,
      p256dh: arrayBufferToBase64(this.subscription.getKey('p256dh')),
      auth: arrayBufferToBase64(this.subscription.getKey('auth')),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('push_subscriptions' as any)
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

    logger.debug('Push subscription saved to database');
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscription(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    const { error } = await supabase
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to remove subscription from database', error);
    } else {
      logger.debug('Push subscription removed from database');
    }
  }

  /**
   * Send a test notification
   */
  public async sendTestNotification(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: 'Test Notification',
          body: 'This is a test push notification from LEAP Recovery!',
          data: { type: 'test' }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Test Sent',
        description: 'A test notification should appear shortly'
      });

    } catch (error) {
      logger.error('Failed to send test notification', error);
      toast({
        title: 'Test Failed',
        description: 'Could not send test notification',
        variant: 'destructive'
      });
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const pushNotificationService = PushNotificationService.getInstance();