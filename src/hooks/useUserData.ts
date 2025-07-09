import { useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/secureStorage';
import { getSecureSession, clearSession, logSecurityEvent } from '@/utils/security';

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
    
    // Cleanup old data on app start
    SecureStorage.cleanupOldData();
  }, []);

  const loadUserData = (username: string) => {
    try {
      const data = SecureStorage.getUserData(username);
      if (data) {
        // Update daily stats
        updateDailyStats(data);
        setUserData(data);
        
        // Update last access
        SecureStorage.updateLastAccess(username);
        logSecurityEvent('user_data_accessed', { username });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      logSecurityEvent('user_data_error', { username, error: error instanceof Error ? error.message : 'Unknown error' });
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
      
      const hasActivity = activityLog.some(entry => 
        new Date(entry.timestamp).toDateString() === dateString
      );
      
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
      console.error('Failed to update user data:', error);
      logSecurityEvent('user_data_update_error', { username: currentUser, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const logActivity = (action: string, details?: string) => {
    if (!userData) return;

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
