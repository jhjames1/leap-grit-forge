import { useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/secureStorage';
import { logger } from '@/utils/logger';
import { getSecureSession, clearSession, logSecurityEvent } from '@/utils/security';
import { trackingManager } from '@/utils/trackingManager';
import { notificationManager } from '@/utils/notificationManager';

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
}

interface JourneyProgress {
  completedDays: number[];
  currentWeek: number;
  badges: string[];
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
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // Check for secure session first
    const session = getSecureSession();
    if (session) {
      setCurrentUser(session.username);
      loadUserData(session.username);
    } else {
      // Fallback to localStorage for backwards compatibility
      const user = localStorage.getItem('currentUser');
      if (user) {
        setCurrentUser(user);
        loadUserData(user);
      }
    }
    
    // Initialize tracking and notifications
    if (currentUser) {
      trackingManager.setUser(currentUser);
      
      // Check and reset daily stats if it's a new day
      trackingManager.checkAndResetDaily();
      
      // Request notification permission
      notificationManager.requestNotificationPermission();
    }
    
    // Cleanup old data on app start
    SecureStorage.cleanupOldData();
  }, [currentUser]);

  const loadUserData = (username: string) => {
    try {
      const data = SecureStorage.getUserData(username);
      if (data) {
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
            ...data.toolboxStats
          },
          journeyProgress: data.journeyProgress || {
            completedDays: [],
            currentWeek: 1,
            badges: []
          },
          journeyResponses: data.journeyResponses || {},
          lastAccess: Date.now()
        };
        
        // Update daily stats
        updateDailyStats(normalizedData);
        setUserData(normalizedData);
        
        // Update last access
        SecureStorage.updateLastAccess(username);
        logSecurityEvent('user_data_accessed', { username });
      } else {
        // Create initial user data if none exists
        const initialData = {
          firstName: username,
          gratitudeEntries: [],
          activityLog: [],
          toolboxStats: {
            toolsToday: 0,
            streak: 0,
            totalSessions: 0,
            urgesThisWeek: 0
          },
          journeyProgress: {
            completedDays: [],
            currentWeek: 1,
            badges: []
          },
          journeyResponses: {},
          lastAccess: Date.now()
        };
        
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
          urgesThisWeek: 0
        },
        journeyProgress: {
          completedDays: [],
          currentWeek: 1,
          badges: []
        },
        journeyResponses: {},
        lastAccess: Date.now()
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
    if (!currentUser) return;
    
    try {
      const existing = SecureStorage.getUserData(currentUser);
      if (existing) {
        const updated = { ...existing, ...updates, lastAccess: Date.now() };
        SecureStorage.setUserData(currentUser, updated);
        setUserData(updated);
        logSecurityEvent('user_data_updated', { username: currentUser });
      }
    } catch (error) {
      logger.error('Failed to update user data', error);
      logSecurityEvent('user_data_update_error', { username: currentUser, error: error instanceof Error ? error.message : 'Unknown error' });
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
    logout
  };
};
