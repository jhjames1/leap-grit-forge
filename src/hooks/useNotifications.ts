import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  notification_type: string;
  created_at: string;
  read_at?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data as unknown) as Notification[];
      setNotifications(typedData || []);
      setUnreadCount((typedData || []).filter(n => !n.is_read).length);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!user) return;

    console.log('Clearing all notifications for user:', user.id);
    console.log('Current notifications before clear:', notifications.length);

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error clearing notifications:', error);
        throw error;
      }

      console.log('Successfully deleted notifications from database');
      
      // Update local state immediately
      setNotifications([]);
      setUnreadCount(0);
      
      console.log('Local state updated - notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      logger.error('Error clearing notifications:', error);
    }
  };

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time notification subscription for user:', user.id);

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received via real-time:', payload.new);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification deleted via real-time:', payload.old);
          const deletedNotification = payload.old as Notification;
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
          if (!deletedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated via real-time:', payload.new);
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Recalculate unread count based on current notifications
          setNotifications(currentNotifications => {
            const newUnreadCount = currentNotifications.filter(n => !n.is_read).length;
            setUnreadCount(newUnreadCount);
            return currentNotifications;
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications: fetchNotifications
  };
};