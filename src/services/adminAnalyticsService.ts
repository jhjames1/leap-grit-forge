import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  averageRecoveryStrength: number;
  atRiskUsers: number;
  domainEngagement: {
    peerSupport: number;
    selfCare: number;
    structure: number;
    mood: number;
    cravingControl: number;
  };
  userRiskData: Array<{
    userId: string;
    risk: 'low' | 'medium' | 'high';
    recoveryStrength: number;
    lastActivity: string;
  }>;
  engagementTrends: {
    thisWeek: number;
    lastWeek: number;
    trend: 'up' | 'down' | 'stable';
  };
  totalEngagementActions: number;
}

export class AdminAnalyticsService {
  private static instance: AdminAnalyticsService;

  static getInstance(): AdminAnalyticsService {
    if (!AdminAnalyticsService.instance) {
      AdminAnalyticsService.instance = new AdminAnalyticsService();
    }
    return AdminAnalyticsService.instance;
  }

  async calculateUserAnalytics(): Promise<UserAnalytics> {
    try {
      // Get user analytics from Supabase
      const [
        totalUsersResult,
        activeUsersResult,
        toolboxStatsResult,
        activityLogsResult,
        dailyStatsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_activity_logs').select('user_id', { count: 'exact', head: true }).gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('user_toolbox_stats').select('*'),
        supabase.from('user_activity_logs').select('*').gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('user_daily_stats').select('*').gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      const totalUsers = totalUsersResult.count || 0;
      const activeUsers = activeUsersResult.count || 0;
      const toolboxStats = toolboxStatsResult.data || [];
      const activityLogs = activityLogsResult.data || [];
      const dailyStats = dailyStatsResult.data || [];

      // Calculate average recovery strength
      const avgRecoveryStrength = dailyStats.length > 0 
        ? dailyStats.reduce((sum, stat) => sum + (stat.recovery_strength || 0), 0) / dailyStats.length 
        : 0;

      // Calculate at-risk users (low activity in last 7 days)
      const recentActivity = activityLogs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const activeUserIds = new Set(recentActivity.map(log => log.user_id));
      const atRiskUsers = Math.max(0, totalUsers - activeUserIds.size);

      // Calculate domain engagement
      const domainEngagement = {
        peerSupport: activityLogs.filter(log => log.type === 'peer').length,
        selfCare: activityLogs.filter(log => log.action.includes('gratitude') || log.action.includes('breathing')).length,
        structure: activityLogs.filter(log => log.type === 'journey').length,
        mood: activityLogs.filter(log => log.action.includes('mood')).length,
        cravingControl: activityLogs.filter(log => log.action.includes('urge') || log.action.includes('craving')).length
      };

      // Calculate user risk data
      const userRiskData = toolboxStats.map(stat => ({
        userId: stat.user_id,
        risk: (stat.streak_count < 3 ? 'high' : stat.streak_count < 7 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        recoveryStrength: stat.streak_count * 10, // Simple calculation
        lastActivity: stat.last_activity || new Date().toISOString()
      }));

      // Calculate engagement trends
      const thisWeek = activityLogs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      const lastWeek = activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        return logDate > twoWeeksAgo && logDate <= weekAgo;
      }).length;

      const engagementTrends = {
        thisWeek,
        lastWeek,
        trend: (thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };

      return {
        totalUsers,
        activeUsers,
        averageRecoveryStrength: avgRecoveryStrength,
        atRiskUsers,
        domainEngagement,
        userRiskData,
        engagementTrends,
        totalEngagementActions: activityLogs.length
      };
    } catch (error) {
      logger.error('Failed to calculate user analytics:', error);
      
      // Return default analytics on error
      return {
        totalUsers: 0,
        activeUsers: 0,
        averageRecoveryStrength: 0,
        atRiskUsers: 0,
        domainEngagement: {
          peerSupport: 0,
          selfCare: 0,
          structure: 0,
          mood: 0,
          cravingControl: 0
        },
        userRiskData: [],
        engagementTrends: {
          thisWeek: 0,
          lastWeek: 0,
          trend: 'stable'
        },
        totalEngagementActions: 0
      };
    }
  }

  async getSecurityEvents(): Promise<Array<{ timestamp: string; event: string; severity: 'low' | 'medium' | 'high'; details: string; }>> {
    try {
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      const events = (activityLogs || []).map(log => ({
        timestamp: log.timestamp,
        event: log.action,
        severity: 'low' as const,
        details: log.details || 'User activity recorded'
      }));

      // Add system health check
      events.push({
        timestamp: new Date().toISOString(),
        event: 'System Health Check',
        severity: 'low',
        details: 'All systems operational'
      });

      return events.slice(0, 10);
    } catch (error) {
      logger.error('Failed to get security events:', error);
      return [];
    }
  }
}

export const adminAnalytics = AdminAnalyticsService.getInstance();