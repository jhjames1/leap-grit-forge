import { SecureStorage } from './secureStorage';

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
    id: string;
    risk: 'low' | 'medium' | 'high';
    lastActive: string;
    recoveryStrength: number;
  }>;
  engagementTrends: {
    peerSupport: number;
    selfCare: number;
    structure: number;
    mood: number;
    cravingControl: number;
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

  getAllUserData(): any[] {
    const users: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('user_')) {
        try {
          const userData = SecureStorage.getUserData(key.replace('user_', ''));
          if (userData) {
            users.push({
              username: key.replace('user_', ''),
              ...userData
            });
          }
        } catch (error) {
          console.warn(`Error loading user data for ${key}:`, error);
        }
      }
    }
    return users;
  }

  calculateUserAnalytics(): UserAnalytics {
    const users = this.getAllUserData();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Basic user metrics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const lastActivity = user.activityLog?.length > 0 
        ? new Date(user.activityLog[user.activityLog.length - 1].timestamp)
        : new Date(0);
      return lastActivity > sevenDaysAgo;
    }).length;

    // Recovery strength calculation
    const recoveryStrengths = users
      .map(user => user.recoveryStrength || 0)
      .filter(strength => strength > 0);
    const averageRecoveryStrength = recoveryStrengths.length > 0 
      ? Math.round(recoveryStrengths.reduce((sum, strength) => sum + strength, 0) / recoveryStrengths.length)
      : 0;

    // At-risk users (low recovery strength or inactive)
    const atRiskUsers = users.filter(user => {
      const strength = user.recoveryStrength || 0;
      const lastActivity = user.activityLog?.length > 0 
        ? new Date(user.activityLog[user.activityLog.length - 1].timestamp)
        : new Date(0);
      const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return strength < 30 || daysSinceActivity > 7;
    }).length;

    // Domain engagement analysis
    const domainCounts = {
      peerSupport: 0,
      selfCare: 0,
      structure: 0,
      mood: 0,
      cravingControl: 0
    };

    let totalEngagementActions = 0;

    users.forEach(user => {
      if (user.activityLog) {
        user.activityLog.forEach((activity: any) => {
          totalEngagementActions++;
          
          // Categorize activities by domain
          const action = activity.action?.toLowerCase() || '';
          const details = activity.details?.toLowerCase() || '';
          
          if (action.includes('peer') || action.includes('chat') || details.includes('peer')) {
            domainCounts.peerSupport++;
          } else if (action.includes('breathing') || action.includes('meditation') || action.includes('gratitude')) {
            domainCounts.selfCare++;
          } else if (action.includes('calendar') || action.includes('schedule') || action.includes('plan')) {
            domainCounts.structure++;
          } else if (action.includes('mood') || action.includes('feeling') || action.includes('emotion')) {
            domainCounts.mood++;
          } else if (action.includes('urge') || action.includes('craving') || action.includes('trigger')) {
            domainCounts.cravingControl++;
          }
        });
      }
    });

    // Calculate engagement percentages
    const domainEngagement = {
      peerSupport: totalEngagementActions > 0 ? Math.round((domainCounts.peerSupport / totalEngagementActions) * 100) : 0,
      selfCare: totalEngagementActions > 0 ? Math.round((domainCounts.selfCare / totalEngagementActions) * 100) : 0,
      structure: totalEngagementActions > 0 ? Math.round((domainCounts.structure / totalEngagementActions) * 100) : 0,
      mood: totalEngagementActions > 0 ? Math.round((domainCounts.mood / totalEngagementActions) * 100) : 0,
      cravingControl: totalEngagementActions > 0 ? Math.round((domainCounts.cravingControl / totalEngagementActions) * 100) : 0,
    };

    // Generate user risk data
    const userRiskData = users.slice(0, 20).map((user, index) => {
      const strength = user.recoveryStrength || 0;
      const lastActivity = user.activityLog?.length > 0 
        ? new Date(user.activityLog[user.activityLog.length - 1].timestamp)
        : new Date(0);
      const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      
      let risk: 'low' | 'medium' | 'high' = 'low';
      if (strength < 20 || daysSinceActivity > 14) {
        risk = 'high';
      } else if (strength < 50 || daysSinceActivity > 7) {
        risk = 'medium';
      }

      return {
        id: `User${String(index + 1).padStart(3, '0')}`,
        risk,
        lastActive: lastActivity.toLocaleDateString(),
        recoveryStrength: strength
      };
    });

    // Engagement trends (same as current percentages for now)
    const engagementTrends = { ...domainEngagement };

    return {
      totalUsers,
      activeUsers,
      averageRecoveryStrength,
      atRiskUsers,
      domainEngagement,
      userRiskData,
      engagementTrends,
      totalEngagementActions
    };
  }

  getSecurityEvents(): Array<{
    timestamp: string;
    event: string;
    severity: 'low' | 'medium' | 'high';
    details: string;
  }> {
    // Get real security events from localStorage or activity logs
    const users = this.getAllUserData();
    const events: any[] = [];
    
    users.forEach(user => {
      if (user.activityLog) {
        user.activityLog.forEach((activity: any) => {
          if (activity.action?.includes('login') || activity.action?.includes('auth')) {
            events.push({
              timestamp: new Date(activity.timestamp).toLocaleString(),
              event: activity.action,
              severity: 'low' as const,
              details: activity.details || 'User authentication'
            });
          }
        });
      }
    });

    // Add some system events
    events.push({
      timestamp: new Date().toLocaleString(),
      event: 'System Health Check',
      severity: 'low' as const,
      details: `${users.length} active user sessions monitored`
    });

    return events.slice(-10); // Return last 10 events
  }
}

export const adminAnalytics = AdminAnalyticsService.getInstance();