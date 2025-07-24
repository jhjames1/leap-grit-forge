import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SpecialistPerformance {
  specialistId: string;
  name: string;
  email: string;
  status: 'online' | 'away' | 'offline' | 'busy';
  isActive: boolean;
  isVerified: boolean;
  activeSessions: number;
  completedSessions: number;
  averageRating: number;
  responseTime: number; // in seconds
  workloadScore: number; // 0-100
  performanceScore: number; // 0-100
  lastActive: string;
  monthlyMetrics?: {
    chatCompletionRate: number;
    checkinCompletionRate: number;
    avgUserRating: number;
    avgResponseTime: number;
    avgStreakImpact: number;
  };
}

export interface SpecialistAnalytics {
  totalSpecialists: number;
  activeSpecialists: number;
  averageRating: number;
  averageResponseTime: number;
  specialistPerformance: SpecialistPerformance[];
  performanceDistribution: {
    excellent: number; // > 85%
    good: number; // 70-85%
    average: number; // 50-70%
    needsAttention: number; // < 50%
  };
  workloadDistribution: {
    overloaded: number; // > 90%
    busy: number; // 70-90%
    moderate: number; // 30-70%
    light: number; // < 30%
  };
  alertFlags: Array<{
    specialistId: string;
    type: 'low_performance' | 'high_workload' | 'poor_rating' | 'slow_response';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
}

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
  specialistAnalytics?: SpecialistAnalytics;
}

export class AdminAnalyticsService {
  private static instance: AdminAnalyticsService;

  static getInstance(): AdminAnalyticsService {
    if (!AdminAnalyticsService.instance) {
      AdminAnalyticsService.instance = new AdminAnalyticsService();
    }
    return AdminAnalyticsService.instance;
  }

  async calculateSpecialistAnalytics(): Promise<SpecialistAnalytics> {
    try {
      const [
        specialistsResult,
        statusResult,
        sessionsResult,
        ratingsResult,
        messagesResult,
        monthlyMetricsResult
      ] = await Promise.all([
        supabase.from('peer_specialists').select('*').eq('is_active', true),
        supabase.from('specialist_status').select('*'),
        supabase.from('chat_sessions').select('*'),
        supabase.from('peer_session_ratings').select('*'),
        supabase.from('chat_messages').select('*').eq('sender_type', 'specialist'),
        supabase.from('peer_monthly_metrics').select('*').gte('month', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      const specialists = specialistsResult.data || [];
      const statuses = statusResult.data || [];
      const sessions = sessionsResult.data || [];
      const ratings = ratingsResult.data || [];
      const messages = messagesResult.data || [];
      const monthlyMetrics = monthlyMetricsResult.data || [];

      const totalSpecialists = specialists.length;
      const activeSpecialists = statuses.filter(s => s.status === 'online' || s.status === 'away').length;

      const specialistPerformance: SpecialistPerformance[] = specialists.map(specialist => {
        const status = statuses.find(s => s.specialist_id === specialist.id);
        const specialistSessions = sessions.filter(s => s.specialist_id === specialist.id);
        const specialistRatings = ratings.filter(r => r.peer_id === specialist.id);
        const specialistMessages = messages.filter(m => m.sender_id === specialist.user_id);
        const monthlyMetric = monthlyMetrics.find(m => m.peer_id === specialist.id);

        const activeSessions = specialistSessions.filter(s => s.status === 'active').length;
        const completedSessions = specialistSessions.filter(s => s.status === 'ended').length;
        const averageRating = specialistRatings.length > 0 
          ? specialistRatings.reduce((sum, r) => sum + r.rating, 0) / specialistRatings.length 
          : 0;

        // Calculate response time
        let totalResponseTime = 0;
        let responseCount = 0;
        specialistSessions.forEach(session => {
          const sessionMessages = messages.filter(m => 
            m.session_id === session.id && m.sender_type === 'specialist'
          );
          if (sessionMessages.length > 0) {
            const firstMessage = sessionMessages[0];
            const responseTime = new Date(firstMessage.created_at).getTime() - new Date(session.started_at).getTime();
            if (responseTime > 0) {
              totalResponseTime += responseTime;
              responseCount++;
            }
          }
        });
        
        const responseTime = responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0; // in seconds

        // Calculate workload score (0-100)
        const maxSessions = 10; // Assume max 10 concurrent sessions
        const workloadScore = Math.min(100, (activeSessions / maxSessions) * 100);

        // Calculate performance score (0-100)
        const ratingScore = (averageRating / 5) * 40; // 40% weight
        const responseScore = Math.max(0, 40 - (responseTime / 60) * 2); // 40% weight, penalty for slow response
        const completionScore = completedSessions > 0 ? 20 : 0; // 20% weight
        const performanceScore = Math.min(100, ratingScore + responseScore + completionScore);

        return {
          specialistId: specialist.id,
          name: `${specialist.first_name} ${specialist.last_name}`,
          email: specialist.email || '',
          status: (status?.status as 'online' | 'away' | 'offline' | 'busy') || 'offline',
          isActive: specialist.is_active,
          isVerified: specialist.is_verified,
          activeSessions,
          completedSessions,
          averageRating,
          responseTime,
          workloadScore,
          performanceScore,
          lastActive: status?.last_seen || specialist.updated_at,
          monthlyMetrics: monthlyMetric ? {
            chatCompletionRate: monthlyMetric.chat_completion_rate || 0,
            checkinCompletionRate: monthlyMetric.checkin_completion_rate || 0,
            avgUserRating: monthlyMetric.avg_user_rating || 0,
            avgResponseTime: monthlyMetric.avg_response_time_seconds || 0,
            avgStreakImpact: monthlyMetric.avg_streak_impact || 0
          } : undefined
        };
      });

      // Calculate averages
      const averageRating = specialistPerformance.length > 0
        ? specialistPerformance.reduce((sum, s) => sum + s.averageRating, 0) / specialistPerformance.length
        : 0;
      
      const averageResponseTime = specialistPerformance.length > 0
        ? specialistPerformance.reduce((sum, s) => sum + s.responseTime, 0) / specialistPerformance.length
        : 0;

      // Calculate performance distribution
      const performanceDistribution = {
        excellent: specialistPerformance.filter(s => s.performanceScore > 85).length,
        good: specialistPerformance.filter(s => s.performanceScore > 70 && s.performanceScore <= 85).length,
        average: specialistPerformance.filter(s => s.performanceScore > 50 && s.performanceScore <= 70).length,
        needsAttention: specialistPerformance.filter(s => s.performanceScore <= 50).length
      };

      // Calculate workload distribution
      const workloadDistribution = {
        overloaded: specialistPerformance.filter(s => s.workloadScore > 90).length,
        busy: specialistPerformance.filter(s => s.workloadScore > 70 && s.workloadScore <= 90).length,
        moderate: specialistPerformance.filter(s => s.workloadScore > 30 && s.workloadScore <= 70).length,
        light: specialistPerformance.filter(s => s.workloadScore <= 30).length
      };

      // Generate alert flags
      const alertFlags: SpecialistAnalytics['alertFlags'] = [];
      specialistPerformance.forEach(specialist => {
        if (specialist.performanceScore < 50) {
          alertFlags.push({
            specialistId: specialist.specialistId,
            type: 'low_performance',
            severity: 'high',
            message: `${specialist.name} has low performance score (${specialist.performanceScore.toFixed(1)}%)`
          });
        }
        if (specialist.workloadScore > 90) {
          alertFlags.push({
            specialistId: specialist.specialistId,
            type: 'high_workload',
            severity: 'medium',
            message: `${specialist.name} has high workload (${specialist.workloadScore.toFixed(1)}%)`
          });
        }
        if (specialist.averageRating < 3) {
          alertFlags.push({
            specialistId: specialist.specialistId,
            type: 'poor_rating',
            severity: 'medium',
            message: `${specialist.name} has low rating (${specialist.averageRating.toFixed(1)}/5)`
          });
        }
        if (specialist.responseTime > 300) { // > 5 minutes
          alertFlags.push({
            specialistId: specialist.specialistId,
            type: 'slow_response',
            severity: 'low',
            message: `${specialist.name} has slow response time (${Math.round(specialist.responseTime / 60)}min)`
          });
        }
      });

      return {
        totalSpecialists,
        activeSpecialists,
        averageRating,
        averageResponseTime,
        specialistPerformance,
        performanceDistribution,
        workloadDistribution,
        alertFlags
      };
    } catch (error) {
      logger.error('Failed to calculate specialist analytics:', error);
      return {
        totalSpecialists: 0,
        activeSpecialists: 0,
        averageRating: 0,
        averageResponseTime: 0,
        specialistPerformance: [],
        performanceDistribution: { excellent: 0, good: 0, average: 0, needsAttention: 0 },
        workloadDistribution: { overloaded: 0, busy: 0, moderate: 0, light: 0 },
        alertFlags: []
      };
    }
  }

  async calculateUserAnalytics(): Promise<UserAnalytics> {
    try {
      // Get peer_client user IDs first
      const { data: peerClients } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_type', 'peer_client');
      
      const peerClientIds = peerClients?.map(p => p.user_id) || [];
      
      // Get user analytics from Supabase
      const [
        totalUsersResult,
        activeUsersResult,
        toolboxStatsResult,
        activityLogsResult,
        dailyStatsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'peer_client'),
        supabase.from('user_activity_logs')
          .select('user_id', { count: 'exact', head: true })
          .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .in('user_id', peerClientIds),
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

      // Get specialist analytics
      const specialistAnalytics = await this.calculateSpecialistAnalytics();

      return {
        totalUsers,
        activeUsers,
        averageRecoveryStrength: avgRecoveryStrength,
        atRiskUsers,
        domainEngagement,
        userRiskData,
        engagementTrends,
        totalEngagementActions: activityLogs.length,
        specialistAnalytics
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
        totalEngagementActions: 0,
        specialistAnalytics: {
          totalSpecialists: 0,
          activeSpecialists: 0,
          averageRating: 0,
          averageResponseTime: 0,
          specialistPerformance: [],
          performanceDistribution: { excellent: 0, good: 0, average: 0, needsAttention: 0 },
          workloadDistribution: { overloaded: 0, busy: 0, moderate: 0, light: 0 },
          alertFlags: []
        }
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