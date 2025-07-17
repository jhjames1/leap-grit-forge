import { SecureStorage } from './secureStorage';
import { SupabaseUserService } from '@/services/supabaseUserService';
import { logger } from './logger';

export interface LegacyUserData {
  username?: string;
  email?: string;
  profile?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    recoveryStartDate?: string;
    phone?: string;
  };
  gratitudeEntries?: Array<{
    id?: string;
    text: string;
    date: string;
    mood?: number;
  }>;
  activityLog?: Array<{
    action: string;
    timestamp?: number;
    details?: string;
    type?: string;
  }>;
  toolboxStats?: {
    toolsUsedToday?: number;
    totalToolsUsed?: number;
    favoriteTools?: string[];
    lastToolUsed?: string;
    lastActivity?: number;
    streak?: number;
    longestStreak?: number;
  };
  journeyProgress?: {
    stage?: string;
    focusAreas?: string[];
    supportStyle?: string;
    currentDay?: number;
    completedDays?: number;
    journeyResponses?: Record<string, any>;
    dailyStats?: Record<string, any>;
  };
  focusAreas?: string[];
  journeyStage?: string;
  supportStyle?: string;
  dailyStats?: Record<string, any>;
  streakData?: {
    currentStreak?: number;
    longestStreak?: number;
    lastActivityDate?: string;
  };
  lastAccess?: number;
  preferences?: Record<string, any>;
}

export class DataMigrationService {
  private static readonly MIGRATION_VERSION = 1;
  private static readonly MIGRATION_KEY = 'leap_migration_v1';

  static async migrateUserData(userId: string, username?: string): Promise<boolean> {
    try {
      logger.info(`Starting data migration for user: ${userId}`);
      
      // Check if migration has already been completed
      const migrationStatus = localStorage.getItem(this.MIGRATION_KEY);
      if (migrationStatus === 'completed') {
        logger.info('Data migration already completed');
        return true;
      }

      // Get legacy data from localStorage
      const legacyData = this.getLegacyUserData(username);
      if (!legacyData) {
        logger.info('No legacy data found for migration');
        return true;
      }

      // Migrate each data type
      await this.migrateUserPreferences(userId, legacyData);
      await this.migrateActivityLogs(userId, legacyData);
      await this.migrateToolboxStats(userId, legacyData);
      await this.migrateGratitudeEntries(userId, legacyData);
      await this.migrateJourneyProgress(userId, legacyData);
      await this.migrateDailyStats(userId, legacyData);

      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_KEY, 'completed');
      logger.info('Data migration completed successfully');
      
      return true;
    } catch (error) {
      logger.error('Error during data migration:', error);
      return false;
    }
  }

  private static getLegacyUserData(username?: string): LegacyUserData | null {
    if (!username) return null;

    try {
      // Try to get data from SecureStorage
      const secureData = SecureStorage.getUserData(username);
      if (secureData) {
        return secureData;
      }

      // Try to get data from old localStorage keys
      const legacyKey = `leap_user_${username}`;
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        return JSON.parse(legacyData);
      }

      return null;
    } catch (error) {
      logger.error('Error getting legacy user data:', error);
      return null;
    }
  }

  private static async migrateUserPreferences(userId: string, legacyData: LegacyUserData): Promise<void> {
    try {
      const preferences = {
        user_id: userId,
        language: 'en', // Default language
        theme: 'system', // Default theme
        notifications_enabled: true,
        sms_opt_in: false,
        phone_number: legacyData.profile?.phone,
        recovery_start_date: legacyData.profile?.recoveryStartDate,
        preferences: legacyData.preferences || {}
      };

      await SupabaseUserService.upsertUserPreferences(preferences);
      logger.info('User preferences migrated successfully');
    } catch (error) {
      logger.error('Error migrating user preferences:', error);
    }
  }

  private static async migrateActivityLogs(userId: string, legacyData: LegacyUserData): Promise<void> {
    try {
      const activityLog = legacyData.activityLog || [];
      
      for (const activity of activityLog) {
        const logEntry = {
          user_id: userId,
          action: activity.action,
          details: activity.details,
          type: (activity.type as 'journey' | 'tool' | 'peer' | 'general') || 'general',
          timestamp: activity.timestamp ? new Date(activity.timestamp).toISOString() : undefined
        };

        await SupabaseUserService.logActivity(logEntry);
      }
      
      logger.info(`Migrated ${activityLog.length} activity log entries`);
    } catch (error) {
      logger.error('Error migrating activity logs:', error);
    }
  }

  private static async migrateToolboxStats(userId: string, legacyData: LegacyUserData): Promise<void> {
    try {
      const toolboxStats = legacyData.toolboxStats || {};
      const streakData = legacyData.streakData || {};
      
      const stats = {
        user_id: userId,
        tools_used_today: toolboxStats.toolsUsedToday || 0,
        total_tools_used: toolboxStats.totalToolsUsed || 0,
        favorite_tools: toolboxStats.favoriteTools || [],
        last_tool_used: toolboxStats.lastToolUsed,
        last_activity: toolboxStats.lastActivity ? new Date(toolboxStats.lastActivity).toISOString() : undefined,
        streak_count: streakData.currentStreak || toolboxStats.streak || 0,
        longest_streak: streakData.longestStreak || toolboxStats.longestStreak || 0
      };

      await SupabaseUserService.upsertToolboxStats(stats);
      logger.info('Toolbox stats migrated successfully');
    } catch (error) {
      logger.error('Error migrating toolbox stats:', error);
    }
  }

  private static async migrateGratitudeEntries(userId: string, legacyData: LegacyUserData): Promise<void> {
    try {
      const gratitudeEntries = legacyData.gratitudeEntries || [];
      
      for (const entry of gratitudeEntries) {
        const gratitudeEntry = {
          user_id: userId,
          entry_text: entry.text,
          date: entry.date,
          mood_rating: entry.mood
        };

        await SupabaseUserService.addGratitudeEntry(gratitudeEntry);
      }
      
      logger.info(`Migrated ${gratitudeEntries.length} gratitude entries`);
    } catch (error) {
      logger.error('Error migrating gratitude entries:', error);
    }
  }

  private static async migrateJourneyProgress(userId: string, legacyData: LegacyUserData): Promise<void> {
    try {
      const journeyProgress = legacyData.journeyProgress || {};
      
      const progress = {
        user_id: userId,
        journey_stage: journeyProgress.stage || legacyData.journeyStage || 'initial',
        focus_areas: journeyProgress.focusAreas || legacyData.focusAreas || [],
        support_style: journeyProgress.supportStyle || legacyData.supportStyle,
        current_day: journeyProgress.currentDay || 1,
        completed_days: Array.isArray(journeyProgress.completedDays) ? journeyProgress.completedDays : [],
        completion_dates: {},
        journey_responses: journeyProgress.journeyResponses || {},
        daily_stats: journeyProgress.dailyStats || legacyData.dailyStats || {}
      };

      await SupabaseUserService.upsertJourneyProgress(progress);
      logger.info('Journey progress migrated successfully');
    } catch (error) {
      logger.error('Error migrating journey progress:', error);
    }
  }

  private static async migrateDailyStats(userId: string, legacyData: LegacyUserData): Promise<void> {
    try {
      // Create a daily stats entry for today if we have legacy data
      const today = new Date().toISOString().split('T')[0];
      const toolboxStats = legacyData.toolboxStats || {};
      
      const dailyStats = {
        user_id: userId,
        date: today,
        actions_completed: toolboxStats.toolsUsedToday || 0,
        tools_used: toolboxStats.favoriteTools || [],
        journey_activities: [],
        recovery_strength: 0, // Will be calculated based on activities
        wellness_level: 'neutral',
        mood_entries: {}
      };

      await SupabaseUserService.upsertDailyStats(dailyStats);
      logger.info('Daily stats migrated successfully');
    } catch (error) {
      logger.error('Error migrating daily stats:', error);
    }
  }

  static async cleanupLegacyData(username?: string): Promise<void> {
    if (!username) return;

    try {
      // Clean up old localStorage entries
      const legacyKey = `leap_user_${username}`;
      localStorage.removeItem(legacyKey);
      
      // Clean up SecureStorage entries
      SecureStorage.removeUserData(username);
      
      logger.info('Legacy data cleanup completed');
    } catch (error) {
      logger.error('Error cleaning up legacy data:', error);
    }
  }

  static isDataMigrated(): boolean {
    return localStorage.getItem(this.MIGRATION_KEY) === 'completed';
  }

  static resetMigration(): void {
    localStorage.removeItem(this.MIGRATION_KEY);
  }
}