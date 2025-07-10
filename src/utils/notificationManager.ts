import { toast } from '@/hooks/use-toast';
import { logger } from './logger';

export interface NotificationSchedule {
  userId: string;
  dayNumber: number;
  scheduledFor: Date;
  type: '12hour' | '3hour' | '1hour';
  sent: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private scheduledNotifications: Map<string, NotificationSchedule[]> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startNotificationChecker();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Schedule reminders for a day's completion
   */
  public scheduleReminders(userId: string, dayNumber: number, completedToday: boolean): void {
    if (completedToday) {
      // Day is already complete, no need for reminders
      this.clearDayReminders(userId, dayNumber);
      return;
    }

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate reminder times
    const twelveHoursBefore = new Date(endOfDay.getTime() - 12 * 60 * 60 * 1000);
    const threeHoursBefore = new Date(endOfDay.getTime() - 3 * 60 * 60 * 1000);
    const oneHourBefore = new Date(endOfDay.getTime() - 1 * 60 * 60 * 1000);

    const notifications: NotificationSchedule[] = [];

    // Only schedule future notifications
    if (now < twelveHoursBefore) {
      notifications.push({
        userId,
        dayNumber,
        scheduledFor: twelveHoursBefore,
        type: '12hour',
        sent: false
      });
    }

    if (now < threeHoursBefore) {
      notifications.push({
        userId,
        dayNumber,
        scheduledFor: threeHoursBefore,
        type: '3hour',
        sent: false
      });
    }

    if (now < oneHourBefore) {
      notifications.push({
        userId,
        dayNumber,
        scheduledFor: oneHourBefore,
        type: '1hour',
        sent: false
      });
    }

    // Store notifications
    const userNotifications = this.scheduledNotifications.get(userId) || [];
    
    // Remove existing notifications for this day
    const filteredNotifications = userNotifications.filter(
      n => n.dayNumber !== dayNumber
    );
    
    // Add new notifications
    this.scheduledNotifications.set(userId, [...filteredNotifications, ...notifications]);

    logger.debug('Reminders scheduled', {
      userId,
      dayNumber,
      scheduledCount: notifications.length,
      times: notifications.map(n => ({ type: n.type, time: n.scheduledFor }))
    });
  }

  /**
   * Clear reminders for a specific day (when completed)
   */
  public clearDayReminders(userId: string, dayNumber: number): void {
    const userNotifications = this.scheduledNotifications.get(userId) || [];
    const filteredNotifications = userNotifications.filter(
      n => n.dayNumber !== dayNumber
    );
    
    this.scheduledNotifications.set(userId, filteredNotifications);
    
    logger.debug('Day reminders cleared', { userId, dayNumber });
  }

  /**
   * Start the notification checker interval
   */
  private startNotificationChecker(): void {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkAndSendNotifications();
    }, 60 * 1000);

    logger.debug('Notification checker started');
  }

  /**
   * Stop the notification checker
   */
  public stopNotificationChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.debug('Notification checker stopped');
    }
  }

  /**
   * Check for due notifications and send them
   */
  private checkAndSendNotifications(): void {
    const now = new Date();
    
    for (const [userId, notifications] of this.scheduledNotifications.entries()) {
      for (const notification of notifications) {
        if (!notification.sent && now >= notification.scheduledFor) {
          this.sendNotification(notification);
          notification.sent = true;
        }
      }
      
      // Clean up old notifications (older than 1 day)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const cleanedNotifications = notifications.filter(
        n => n.scheduledFor > oneDayAgo
      );
      
      this.scheduledNotifications.set(userId, cleanedNotifications);
    }
  }

  /**
   * Send a notification
   */
  private sendNotification(notification: NotificationSchedule): void {
    const messages = {
      '12hour': "You've got 12 hours left to finish today's LEAP.",
      '3hour': "3 hours left—let's finish strong.",
      '1hour': "1 hour left today. Take your LEAP now."
    };

    const titles = {
      '12hour': "Daily LEAP Reminder",
      '3hour': "Almost There!",
      '1hour': "Final Hour!"
    };

    const message = messages[notification.type];
    const title = titles[notification.type];

    // Show toast notification
    toast({
      title,
      description: message,
      duration: 10000, // Show for 10 seconds
    });

    // Try to show browser notification if permission granted
    this.showBrowserNotification(title, message);

    logger.debug('Notification sent', {
      userId: notification.userId,
      dayNumber: notification.dayNumber,
      type: notification.type,
      message
    });
  }

  /**
   * Show browser notification if permission is granted
   */
  private showBrowserNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico', // You can add a custom icon here
          tag: 'leap-reminder', // Prevents duplicate notifications
        });
      } catch (error) {
        logger.error('Failed to show browser notification', error);
      }
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      logger.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      logger.debug('Notification permission requested', { granted });
      return granted;
    } catch (error) {
      logger.error('Failed to request notification permission', error);
      return false;
    }
  }

  /**
   * Get scheduled notifications for a user (for debugging)
   */
  public getScheduledNotifications(userId: string): NotificationSchedule[] {
    return this.scheduledNotifications.get(userId) || [];
  }

  /**
   * Clear all notifications for a user
   */
  public clearAllUserNotifications(userId: string): void {
    this.scheduledNotifications.delete(userId);
    logger.debug('All user notifications cleared', { userId });
  }
}

export const notificationManager = NotificationManager.getInstance();