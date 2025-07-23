import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adminAnalytics, type UserAnalytics } from '@/services/adminAnalyticsService';
import { logger } from '@/utils/logger';

export const useRealtimeAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);
      const data = await adminAnalytics.calculateUserAnalytics();
      setAnalytics(data);
      logger.debug('Analytics loaded:', data);
    } catch (err) {
      logger.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data function
  const refreshAnalytics = useCallback(() => {
    setIsLoading(true);
    loadAnalytics();
  }, [loadAnalytics]);

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Set up real-time subscriptions
  useEffect(() => {
    logger.debug('Setting up real-time subscriptions for admin analytics');

    // Create a single channel for all database changes
    const channel = supabase
      .channel('admin-analytics-updates')
      // Listen to profile changes (user counts)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          logger.debug('Profile change detected, refreshing analytics');
          loadAnalytics();
        }
      )
      // Listen to user activity changes (engagement data)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs'
        },
        () => {
          logger.debug('User activity change detected, refreshing analytics');
          loadAnalytics();
        }
      )
      // Listen to daily stats changes (recovery strength, activity completion)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_daily_stats'
        },
        () => {
          logger.debug('Daily stats change detected, refreshing analytics');
          loadAnalytics();
        }
      )
      // Listen to chat session changes (active chats)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          logger.debug('Chat session change detected, refreshing analytics');
          loadAnalytics();
        }
      )
      // Listen to specialist changes (specialist count)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'peer_specialists'
        },
        () => {
          logger.debug('Specialist change detected, refreshing analytics');
          loadAnalytics();
        }
      )
      // Listen to gratitude entries (engagement)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_gratitude_entries'
        },
        () => {
          logger.debug('Gratitude entry change detected, refreshing analytics');
          loadAnalytics();
        }
      )
      .subscribe((status) => {
        logger.debug('Real-time subscription status:', status);
      });

    // Set up periodic refresh as fallback (every 5 minutes)
    const interval = setInterval(() => {
      logger.debug('Periodic analytics refresh');
      loadAnalytics();
    }, 5 * 60 * 1000);

    return () => {
      logger.debug('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics
  };
};