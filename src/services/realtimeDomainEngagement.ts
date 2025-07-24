import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface DomainEngagementData {
  peerSupport: number;
  selfCare: number;
  structure: number;
  mood: number;
  cravingControl: number;
  totalActions: number;
  lastActivity?: string;
}

export interface UserRiskData {
  userId: string;
  risk: 'low' | 'medium' | 'high';
  recoveryStrength: number;
  lastActivity: string;
  activityCount: number;
}

export class RealtimeDomainEngagementService {
  private static instance: RealtimeDomainEngagementService;
  private subscribers: Set<(data: DomainEngagementData) => void> = new Set();
  private riskSubscribers: Set<(data: UserRiskData[]) => void> = new Set();
  private channel: any = null;
  private currentData: DomainEngagementData | null = null;
  private currentRiskData: UserRiskData[] = [];

  static getInstance(): RealtimeDomainEngagementService {
    if (!RealtimeDomainEngagementService.instance) {
      RealtimeDomainEngagementService.instance = new RealtimeDomainEngagementService();
    }
    return RealtimeDomainEngagementService.instance;
  }

  private constructor() {
    this.setupRealtimeSubscription();
    this.calculateInitialData();
  }

  // Subscribe to domain engagement updates
  subscribeToDomainEngagement(callback: (data: DomainEngagementData) => void): () => void {
    this.subscribers.add(callback);
    // Send current data immediately if available
    if (this.currentData) {
      callback(this.currentData);
    }
    return () => this.subscribers.delete(callback);
  }

  // Subscribe to user risk updates
  subscribeToUserRisk(callback: (data: UserRiskData[]) => void): () => void {
    this.riskSubscribers.add(callback);
    // Send current data immediately if available
    if (this.currentRiskData.length > 0) {
      callback(this.currentRiskData);
    }
    return () => this.riskSubscribers.delete(callback);
  }

  private setupRealtimeSubscription() {
    this.channel = supabase
      .channel('domain-engagement-realtime')
      // Real-time activity tracking
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs'
        },
        (payload) => {
          logger.debug('New activity detected:', payload.new);
          this.handleNewActivity(payload.new);
        }
      )
      // Real-time daily stats updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_daily_stats'
        },
        () => {
          logger.debug('Daily stats updated, recalculating risk');
          this.recalculateUserRisk();
        }
      )
      // Real-time gratitude entries
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_gratitude_entries'
        },
        () => {
          logger.debug('New gratitude entry, updating self-care engagement');
          this.incrementDomainEngagement('selfCare');
        }
      )
      // Real-time chat sessions for peer support
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            logger.debug('Chat session activity, updating peer support');
            this.incrementDomainEngagement('peerSupport');
          }
        }
      )
      .subscribe((status) => {
        logger.debug('Domain engagement real-time subscription status:', status);
      });
  }

  private async calculateInitialData() {
    try {
      // Get peer client IDs
      const { data: peerClients } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_type', 'peer_client');
      
      const peerClientIds = peerClients?.map(p => p.user_id) || [];

      // Get recent activity logs
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .in('user_id', peerClientIds);

      const logs = activityLogs || [];
      
      // Calculate domain engagement
      const domainCounts = {
        peerSupport: logs.filter(log => 
          log.type === 'peer' || 
          log.action.includes('chat') || 
          log.action.includes('session')
        ).length,
        selfCare: logs.filter(log => 
          log.action.includes('gratitude') || 
          log.action.includes('breathing') || 
          log.action.includes('meditation')
        ).length,
        structure: logs.filter(log => 
          log.type === 'journey' || 
          log.action.includes('calendar') || 
          log.action.includes('plan')
        ).length,
        mood: logs.filter(log => 
          log.action.includes('mood') || 
          log.action.includes('feeling')
        ).length,
        cravingControl: logs.filter(log => 
          log.action.includes('urge') || 
          log.action.includes('craving') || 
          log.action.includes('trigger')
        ).length
      };

      this.currentData = {
        ...domainCounts,
        totalActions: logs.length,
        lastActivity: logs.length > 0 ? logs[0].timestamp : undefined
      };

      // Calculate user risk data
      await this.recalculateUserRisk();

      // Notify subscribers
      this.notifySubscribers();
    } catch (error) {
      logger.error('Error calculating initial domain engagement data:', error);
    }
  }

  private handleNewActivity(activity: any) {
    if (!this.currentData) return;

    // Categorize the new activity
    const action = activity.action?.toLowerCase() || '';
    const type = activity.type?.toLowerCase() || '';

    if (type === 'peer' || action.includes('chat') || action.includes('session')) {
      this.currentData.peerSupport++;
    } else if (action.includes('gratitude') || action.includes('breathing') || action.includes('meditation')) {
      this.currentData.selfCare++;
    } else if (type === 'journey' || action.includes('calendar') || action.includes('plan')) {
      this.currentData.structure++;
    } else if (action.includes('mood') || action.includes('feeling')) {
      this.currentData.mood++;
    } else if (action.includes('urge') || action.includes('craving') || action.includes('trigger')) {
      this.currentData.cravingControl++;
    }

    this.currentData.totalActions++;
    this.currentData.lastActivity = activity.timestamp;

    // Notify subscribers
    this.notifySubscribers();
  }

  private incrementDomainEngagement(domain: keyof DomainEngagementData) {
    if (!this.currentData || typeof this.currentData[domain] !== 'number') return;
    
    (this.currentData[domain] as number)++;
    this.currentData.totalActions++;
    this.currentData.lastActivity = new Date().toISOString();
    
    this.notifySubscribers();
  }

  private async recalculateUserRisk() {
    try {
      const { data: peerClients } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_type', 'peer_client');
      
      const peerClientIds = peerClients?.map(p => p.user_id) || [];

      // Get recent activity and daily stats
      const [activityResult, dailyStatsResult] = await Promise.all([
        supabase
          .from('user_activity_logs')
          .select('user_id, timestamp')
          .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .in('user_id', peerClientIds),
        supabase
          .from('user_daily_stats')
          .select('user_id, recovery_strength, date')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .in('user_id', peerClientIds)
      ]);

      const activities = activityResult.data || [];
      const dailyStats = dailyStatsResult.data || [];

      // Calculate risk for each user
      this.currentRiskData = peerClientIds.map(userId => {
        const userActivities = activities.filter(a => a.user_id === userId);
        const userStats = dailyStats.filter(s => s.user_id === userId);
        
        const activityCount = userActivities.length;
        const avgRecoveryStrength = userStats.length > 0 
          ? userStats.reduce((sum, stat) => sum + (stat.recovery_strength || 0), 0) / userStats.length 
          : 0;
        
        const lastActivity = userActivities.length > 0 
          ? userActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
          : new Date(0).toISOString();

        const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
        
        let risk: 'low' | 'medium' | 'high' = 'low';
        if (avgRecoveryStrength < 30 || daysSinceActivity > 5 || activityCount < 3) {
          risk = 'high';
        } else if (avgRecoveryStrength < 60 || daysSinceActivity > 2 || activityCount < 7) {
          risk = 'medium';
        }

        return {
          userId,
          risk,
          recoveryStrength: avgRecoveryStrength,
          lastActivity,
          activityCount
        };
      }).filter(user => user.activityCount > 0 || user.recoveryStrength > 0); // Only include users with some data

      // Notify risk subscribers
      this.riskSubscribers.forEach(callback => callback(this.currentRiskData));
    } catch (error) {
      logger.error('Error recalculating user risk:', error);
    }
  }

  private notifySubscribers() {
    if (this.currentData) {
      this.subscribers.forEach(callback => callback(this.currentData!));
    }
  }

  // Clean up method
  destroy() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    this.subscribers.clear();
    this.riskSubscribers.clear();
  }
}

export const realtimeDomainEngagement = RealtimeDomainEngagementService.getInstance();