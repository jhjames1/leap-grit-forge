import { useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/secureStorage';
import { logger } from '@/utils/logger';
import { getSecureSession, clearSession, logSecurityEvent } from '@/utils/security';
import { trackingManager } from '@/utils/trackingManager';
import { notificationManager } from '@/utils/notificationManager';
import { SupabaseUserService } from '@/services/supabaseUserService';
import { DataMigrationService } from '@/utils/dataMigration';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface ToolboxStats {
  toolsToday: number;
  streak: number;
  totalSessions: number;
  urgesThisWeek: number;
  courageCoins: number;
}

interface JourneyProgress {
  completedDays: number[];
  currentWeek: number;
  badges: string[];
  completionDates?: Record<number, string>; // Store completion timestamps
}

interface UserData {
  firstName: string;
  gratitudeEntries: any[];
  activityLog: ActivityLogEntry[];
  toolboxStats: ToolboxStats;
  journeyProgress?: JourneyProgress;
  journeyResponses?: Record<string, string>;
  focusAreas?: string[];
  journeyStage?: string;
  supportStyle?: string;
  dailyStats?: Record<string, any>;
  streakData?: any;
  lastAccess?: number;
  gender?: string;
  lastSeenBadges?: string[]; // Track which badges user has been shown
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user, session } = useAuth();

  useEffect(() => {
    const initializeUser = async () => {
      if (user && session) {
        // Authenticated user - use Supabase
        logger.debug('Found authenticated user', { userId: user.id, email: user.email });
        setCurrentUser(user.id);
        setIsAuthenticated(true);
        
        // Run migration if needed
        if (!DataMigrationService.isDataMigrated()) {
          logger.info('Running data migration for authenticated user');
          await DataMigrationService.migrateUserData(user.id, user.email);
        }
        
        await loadUserData(user.id, true);
        return;
      }

      // Check for secure session first (legacy)
      const secureSession = getSecureSession();
      if (secureSession) {
        logger.debug('Found secure session', { username: secureSession.username });
        setCurrentUser(secureSession.username);
        setIsAuthenticated(false);
        await loadUserData(secureSession.username, false);
        return;
      }

      // Fallback to localStorage for backwards compatibility
      const localUser = localStorage.getItem('currentUser');
      if (localUser) {
        logger.debug('Found localStorage user', { user: localUser });
        setCurrentUser(localUser);
        setIsAuthenticated(false);
        await loadUserData(localUser, false);
        return;
      }

      // If no user found, create a guest user for testing
      logger.debug('No user found, creating guest user');
      const guestUser = 'guest-user';
      localStorage.setItem('currentUser', guestUser);
      setCurrentUser(guestUser);
      setIsAuthenticated(false);
      await loadUserData(guestUser, false);
    };

    initializeUser();
  }, [user, session]);

  useEffect(() => {
    // Initialize tracking and notifications when user is set
    if (currentUser && userData) {
      trackingManager.setUser(currentUser);
      
      // Check and reset daily stats if it's a new day
      trackingManager.checkAndResetDaily();
      
      // Request notification permission
      notificationManager.requestNotificationPermission();
    }
    
    // Cleanup old data on app start
    SecureStorage.cleanupOldData();
  }, [currentUser, userData]);

  const loadSupabaseUserData = async (userId: string): Promise<UserData | null> => {
    try {
      // Load profile data first to get the firstName
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        logger.error('Failed to load profile data:', profileError);
      }

      // Load all user data from Supabase
      const [
        journeyProgress,
        toolboxStats,
        gratitudeEntries,
        activityLogs,
        preferences
      ] = await Promise.all([
        SupabaseUserService.getJourneyProgress(userId),
        SupabaseUserService.getToolboxStats(userId),
        SupabaseUserService.getGratitudeEntries(userId),
        SupabaseUserService.getActivityLogs(userId, 50),
        SupabaseUserService.getUserPreferences(userId)
      ]);

      // Use profile first_name if available, fallback to preferences, then userId
      const firstName = profileData?.first_name || 
                       preferences?.preferences?.firstName || 
                       userId;

      // Transform Supabase data to UserData format
      const userData: UserData = {
        firstName,
        gratitudeEntries: gratitudeEntries.map(entry => ({
          id: entry.id,
          text: entry.entry_text,
          date: entry.date,
          mood: entry.mood_rating
        })),
        activityLog: activityLogs.map(log => ({
          id: log.id || Date.now().toString(),
          action: log.action,
          timestamp: log.timestamp || new Date().toISOString(),
          details: log.details
        })),
        toolboxStats: {
          toolsToday: toolboxStats?.tools_used_today || 0,
          streak: toolboxStats?.streak_count || 0,
          totalSessions: toolboxStats?.total_tools_used || 0,
          urgesThisWeek: 0, // Will be calculated
          courageCoins: 0 // Will be calculated
        },
        journeyProgress: journeyProgress ? {
          completedDays: journeyProgress.completed_days || [],
          currentWeek: Math.floor(journeyProgress.current_day / 7) + 1,
          badges: [],
          completionDates: journeyProgress.completion_dates || {}
        } : {
          completedDays: [],
          currentWeek: 1,
          badges: [],
          completionDates: {}
        },
        journeyResponses: journeyProgress?.journey_responses || {},
        focusAreas: journeyProgress?.focus_areas || ['stress_management'],
        journeyStage: journeyProgress?.journey_stage || 'foundation',
        supportStyle: journeyProgress?.support_style,
        dailyStats: journeyProgress?.daily_stats || {},
        lastAccess: Date.now(),
        lastSeenBadges: []
      };

      return userData;
    } catch (error) {
      logger.error('Failed to load Supabase user data:', error);
      return null;
    }
  };

  const initializeSupabaseUserData = async (userId: string, initialData: UserData): Promise<void> => {
    try {
      // Initialize user data in Supabase
      await Promise.all([
        SupabaseUserService.upsertJourneyProgress({
          user_id: userId,
          journey_stage: initialData.journeyStage || 'foundation',
          focus_areas: initialData.focusAreas || ['stress_management'],
          support_style: initialData.supportStyle,
          current_day: 1,
          completed_days: [],
          journey_responses: initialData.journeyResponses || {},
          daily_stats: initialData.dailyStats || {}
        }),
        SupabaseUserService.upsertToolboxStats({
          user_id: userId,
          tools_used_today: 0,
          total_tools_used: 0,
          favorite_tools: [],
          streak_count: 0,
          longest_streak: 0
        }),
        SupabaseUserService.upsertUserPreferences({
          user_id: userId,
          language: 'en',
          theme: 'system',
          notifications_enabled: true,
          sms_opt_in: false,
          gender: initialData.gender || '',
          preferences: {
            firstName: initialData.firstName || userId,
            ...initialData
          }
        })
      ]);
      
      logger.info('Supabase user data initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Supabase user data:', error);
    }
  };

  const loadUserData = async (username: string, useSupabase: boolean = false) => {
    try {
      logger.debug('Loading user data for', { username, useSupabase });
      
      if (useSupabase) {
        // Load data from Supabase
        const supabaseData = await loadSupabaseUserData(username);
        if (supabaseData) {
          setUserData(supabaseData);
          logSecurityEvent('user_data_accessed', { username });
          return;
        }
      }
      
      // Fallback to localStorage/SecureStorage
      const data = SecureStorage.getUserData(username);
      
      if (data) {
        logger.debug('Found existing user data', { 
          username,
          completedDaysCount: data.journeyProgress?.completedDays?.length || 0,
          hasJourneyResponses: !!data.journeyResponses,
          journeyResponsesCount: Object.keys(data.journeyResponses || {}).length
        });
        
        // Ensure data has required structure
        const normalizedData = {
          firstName: data.firstName || username,
          gratitudeEntries: data.gratitudeEntries || [],
          activityLog: data.activityLog || [],
          toolboxStats: {
            toolsToday: 0,
            streak: 0,
            totalSessions: 0,
            urgesThisWeek: 0,
            courageCoins: 0,
            ...data.toolboxStats
          },
          journeyProgress: data.journeyProgress || {
            completedDays: [],
            currentWeek: 1,
            badges: [],
            completionDates: {}
          },
          journeyResponses: data.journeyResponses || {},
          focusAreas: data.focusAreas || ['stress_management'],
          journeyStage: data.journeyStage || 'foundation',
          lastAccess: Date.now(),
          lastSeenBadges: data.lastSeenBadges || []
        };
        
        // Update daily stats
        updateDailyStats(normalizedData);
        setUserData(normalizedData);
        
        // Update last access
        SecureStorage.updateLastAccess(username);
        logSecurityEvent('user_data_accessed', { username });
      } else {
        logger.debug('Creating new user data for', { username });
        
        // Create initial user data if none exists
        const initialData = {
          firstName: username,
          gratitudeEntries: [],
          activityLog: [],
          toolboxStats: {
            toolsToday: 0,
            streak: 0,
            totalSessions: 0,
            urgesThisWeek: 0,
            courageCoins: 0
          },
          journeyProgress: {
            completedDays: [],
            currentWeek: 1,
            badges: [],
            completionDates: {}
          },
          journeyResponses: {},
          focusAreas: ['stress_management'],
          journeyStage: 'foundation',
          lastAccess: Date.now(),
          lastSeenBadges: []
        };
        
        if (useSupabase) {
          // Initialize Supabase data
          await initializeSupabaseUserData(username, initialData);
        }
        
        SecureStorage.setUserData(username, initialData);
        setUserData(initialData);
        logSecurityEvent('user_data_created', { username });
      }
    } catch (error) {
      logger.error('Failed to load user data', error);
      logSecurityEvent('user_data_error', { username, error: error instanceof Error ? error.message : 'Unknown error' });
      
      // Create minimal fallback data
      const fallbackData = {
        firstName: username,
        gratitudeEntries: [],
        activityLog: [],
        toolboxStats: {
          toolsToday: 0,
          streak: 0,
          totalSessions: 0,
          urgesThisWeek: 0,
          courageCoins: 0
        },
        journeyProgress: {
          completedDays: [],
          currentWeek: 1,
          badges: [],
          completionDates: {}
        },
        journeyResponses: {},
        focusAreas: ['stress_management'],
        journeyStage: 'foundation',
        lastAccess: Date.now(),
        lastSeenBadges: []
      };
      setUserData(fallbackData);
    }
  };

  const updateDailyStats = (data: UserData) => {
    const today = new Date().toDateString();
    const todayActivities = data.activityLog.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );

    // Update toolbox stats
    const updatedStats = {
      ...data.toolboxStats,
      toolsToday: todayActivities.length,
      streak: calculateStreak(data.activityLog)
    };

    if (updatedStats.toolsToday !== data.toolboxStats.toolsToday) {
      updateUserData({ toolboxStats: updatedStats });
    }
  };

  const calculateStreak = (activityLog: ActivityLogEntry[]): number => {
    const today = new Date();
    let currentStreak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      // Check for any activity or journey completion on this day
      const hasActivity = activityLog.some(entry => {
        const entryDate = new Date(entry.timestamp).toDateString();
        return entryDate === dateString && (
          entry.action.includes('Used') || 
          entry.action.includes('Completed Day') ||
          entry.action.includes('journey') ||
          entry.action.includes('tool')
        );
      });
      
      if (hasActivity) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return currentStreak;
  };

  const updateUserData = (updates: Partial<UserData>) => {
    if (!currentUser) {
      logger.error('updateUserData called without currentUser');
      return;
    }
    
    try {
      const existing = SecureStorage.getUserData(currentUser);
      if (existing) {
        const updated = { ...existing, ...updates, lastAccess: Date.now() };
        
        logger.debug('Updating user data', { 
          username: currentUser, 
          updates: Object.keys(updates),
          journeyProgress: updates.journeyProgress,
          journeyResponses: updates.journeyResponses ? Object.keys(updates.journeyResponses) : undefined
        });
        
        // Save to storage first - this is critical for persistence
        SecureStorage.setUserData(currentUser, updated);
        
        // Then update state with validation
        setUserData(updated);
        
        // Log the update
        logSecurityEvent('user_data_updated', { username: currentUser });
        
        logger.debug('User data updated successfully', {
          completedDays: updated.journeyProgress?.completedDays?.length || 0,
          journeyResponsesCount: Object.keys(updated.journeyResponses || {}).length,
          isJourneyProgress: !!updates.journeyProgress
        });
        
        // If this is a journey progress update, trigger additional logging
        if (updates.journeyProgress) {
          logger.debug('Journey progress update details', {
            completedDaysArray: updated.journeyProgress?.completedDays,
            completionDates: updated.journeyProgress?.completionDates
          });
        }
      } else {
        logger.error('No existing user data found for update');
      }
    } catch (error) {
      logger.error('Failed to update user data', error);
      logSecurityEvent('user_data_update_error', { username: currentUser, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Force refresh user data from storage and database
  const refreshUserData = async () => {
    if (currentUser) {
      logger.debug('Force refreshing user data from database');
      await loadUserData(currentUser, isAuthenticated);
    }
  };

  const logActivity = (action: string, details?: string, type: 'journey' | 'tool' | 'peer' | 'general' = 'general') => {
    if (!userData || !currentUser) return;

    // Use tracking manager for enhanced activity logging
    trackingManager.logActivity(action, type, details);

    // Also maintain the legacy activity log for backward compatibility
    const newActivity: ActivityLogEntry = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      details
    };

    const updatedLog = [newActivity, ...userData.activityLog].slice(0, 50); // Keep last 50 activities
    updateUserData({ activityLog: updatedLog });
  };

  const updateToolboxStats = (updates: Partial<ToolboxStats>) => {
    if (!userData) return;
    
    const updatedStats = { ...userData.toolboxStats, ...updates };
    updateUserData({ toolboxStats: updatedStats });
  };

  const markDayComplete = async (day: number) => {
    if (!userData) return;

    const updatedCompletedDays = [...userData.journeyProgress?.completedDays || []];
    const completionDates = { ...userData.journeyProgress?.completionDates || {} };

    // Add day to completed days if not already there
    if (!updatedCompletedDays.includes(day)) {
      updatedCompletedDays.push(day);
      completionDates[day] = new Date().toISOString();
    }

    const updatedJourneyProgress = {
      ...userData.journeyProgress,
      completedDays: updatedCompletedDays,
      completionDates,
      currentWeek: Math.max(userData.journeyProgress?.currentWeek || 1, Math.ceil(day / 7))
    };

    const updatedUserData = {
      ...userData,
      journeyProgress: updatedJourneyProgress
    };

    setUserData(updatedUserData);
    SecureStorage.setUserData(currentUser, updatedUserData);

    // Sync to Supabase if authenticated
    if (isAuthenticated && currentUser) {
      await SupabaseUserService.upsertJourneyProgress({
        user_id: currentUser,
        current_day: Math.max(userData.journeyProgress?.currentWeek || 1, day + 1),
        completed_days: updatedCompletedDays,
        completion_dates: completionDates,
        journey_stage: userData.journeyStage || 'foundation',
        focus_areas: userData.focusAreas || [],
        support_style: userData.supportStyle,
        journey_responses: userData.journeyResponses || {},
        daily_stats: userData.dailyStats || {}
      });
      
      // Force refresh after successful sync
      setTimeout(() => {
        refreshUserData();
      }, 100);
    }

    logActivity(`completed_day_${day}`, `Day ${day} completed`, 'journey');
  };

  const logout = () => {
    if (currentUser) {
      logSecurityEvent('user_logout', { username: currentUser });
    }
    clearSession();
    setCurrentUser(null);
    setUserData(null);
  };

  return {
    userData,
    currentUser,
    updateUserData,
    logActivity,
    updateToolboxStats,
    loadUserData,
    logout,
    setUserData, // Export setUserData for manual state updates
    refreshUserData, // Export refresh function
    markDayComplete
  };
};
