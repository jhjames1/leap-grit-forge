import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface UserActivityLog {
  id?: string;
  user_id: string;
  action: string;
  details?: string;
  type: 'journey' | 'tool' | 'peer' | 'general';
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface UserToolboxStats {
  id?: string;
  user_id: string;
  tools_used_today: number;
  total_tools_used: number;
  favorite_tools: string[];
  last_tool_used?: string;
  last_activity?: string;
  streak_count: number;
  longest_streak: number;
}

export interface UserGratitudeEntry {
  id?: string;
  user_id: string;
  entry_text: string;
  date: string;
  mood_rating?: number;
  tags?: string[];
}

export interface UserJourneyProgress {
  id?: string;
  user_id: string;
  journey_stage: string;
  focus_areas: string[];
  support_style?: string;
  current_day: number;
  completed_days: number[];
  completion_dates?: Record<number, string>;
  journey_responses: Record<string, any>;
  daily_stats: Record<string, any>;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  language: string;
  theme: string;
  notifications_enabled: boolean;
  sms_opt_in: boolean;
  phone_number?: string;
  timezone?: string;
  recovery_start_date?: string;
  gender?: string;
  preferences: Record<string, any>;
}

export interface UserDailyStats {
  id?: string;
  user_id: string;
  date: string;
  actions_completed: number;
  tools_used: string[];
  journey_activities: string[];
  recovery_strength: number;
  wellness_level: string;
  mood_entries: Record<string, any>;
}

export class SupabaseUserService {
  // Activity Logs
  static async logActivity(activity: UserActivityLog): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_activity_logs')
        .insert([activity]);
      
      if (error) {
        logger.error('Failed to log activity:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error logging activity:', error);
      return false;
    }
  }

  static async getActivityLogs(userId: string, limit: number = 100): Promise<UserActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch activity logs:', error);
        return [];
      }
      return (data || []).map(item => ({
        ...item,
        type: item.type as 'journey' | 'tool' | 'peer' | 'general',
        metadata: item.metadata as Record<string, any> || {}
      }));
    } catch (error) {
      logger.error('Error fetching activity logs:', error);
      return [];
    }
  }

  // Toolbox Stats
  static async getToolboxStats(userId: string): Promise<UserToolboxStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_toolbox_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch toolbox stats:', error);
        return null;
      }
      return data;
    } catch (error) {
      logger.error('Error fetching toolbox stats:', error);
      return null;
    }
  }

  static async upsertToolboxStats(stats: UserToolboxStats): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_toolbox_stats')
        .upsert([stats], { onConflict: 'user_id' });

      if (error) {
        logger.error('Failed to upsert toolbox stats:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error upserting toolbox stats:', error);
      return false;
    }
  }

  // Gratitude Entries
  static async getGratitudeEntries(userId: string): Promise<UserGratitudeEntry[]> {
    try {
      const { data, error } = await supabase
        .from('user_gratitude_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch gratitude entries:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      logger.error('Error fetching gratitude entries:', error);
      return [];
    }
  }

  static async addGratitudeEntry(entry: UserGratitudeEntry): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_gratitude_entries')
        .insert([entry]);

      if (error) {
        logger.error('Failed to add gratitude entry:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error adding gratitude entry:', error);
      return false;
    }
  }

  static async updateGratitudeEntry(id: string, entry: Partial<UserGratitudeEntry>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_gratitude_entries')
        .update(entry)
        .eq('id', id);

      if (error) {
        logger.error('Failed to update gratitude entry:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error updating gratitude entry:', error);
      return false;
    }
  }

  static async deleteGratitudeEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_gratitude_entries')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete gratitude entry:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error deleting gratitude entry:', error);
      return false;
    }
  }

  // Journey Progress
  static async getJourneyProgress(userId: string): Promise<UserJourneyProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_journey_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch journey progress:', error);
        return null;
      }
      return data ? {
        ...data,
        journey_responses: data.journey_responses as Record<string, any> || {},
        daily_stats: data.daily_stats as Record<string, any> || {},
        completion_dates: data.completion_dates as Record<number, string> || {}
      } : null;
    } catch (error) {
      logger.error('Error fetching journey progress:', error);
      return null;
    }
  }

  static async upsertJourneyProgress(progress: UserJourneyProgress): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_journey_progress')
        .upsert([progress], { onConflict: 'user_id' });

      if (error) {
        logger.error('Failed to upsert journey progress:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error upserting journey progress:', error);
      return false;
    }
  }

  // User Preferences
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch user preferences:', error);
        return null;
      }
      return data ? {
        ...data,
        preferences: data.preferences as Record<string, any> || {}
      } : null;
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      return null;
    }
  }

  static async upsertUserPreferences(preferences: UserPreferences): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert([preferences], { onConflict: 'user_id' });

      if (error) {
        logger.error('Failed to upsert user preferences:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error upserting user preferences:', error);
      return false;
    }
  }

  // Daily Stats
  static async getDailyStats(userId: string, date: string): Promise<UserDailyStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch daily stats:', error);
        return null;
      }
      return data ? {
        ...data,
        mood_entries: data.mood_entries as Record<string, any> || {}
      } : null;
    } catch (error) {
      logger.error('Error fetching daily stats:', error);
      return null;
    }
  }

  static async upsertDailyStats(stats: UserDailyStats): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_daily_stats')
        .upsert([stats], { onConflict: 'user_id,date' });

      if (error) {
        logger.error('Failed to upsert daily stats:', error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error upserting daily stats:', error);
      return false;
    }
  }

  static async getWeeklyStats(userId: string, startDate: string, endDate: string): Promise<UserDailyStats[]> {
    try {
      const { data, error } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        logger.error('Failed to fetch weekly stats:', error);
        return [];
      }
      return (data || []).map(item => ({
        ...item,
        mood_entries: item.mood_entries as Record<string, any> || {}
      }));
    } catch (error) {
      logger.error('Error fetching weekly stats:', error);
      return [];
    }
  }
}