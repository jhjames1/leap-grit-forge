import { useState, useEffect } from 'react';

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
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(user);
      loadUserData(user);
    }
  }, []);

  const loadUserData = (username: string) => {
    const userKey = `user_${username.toLowerCase()}`;
    const data = localStorage.getItem(userKey);
    if (data) {
      const parsed = JSON.parse(data);
      // Update daily stats
      updateDailyStats(parsed);
      setUserData(parsed);
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
    
    const userKey = `user_${currentUser.toLowerCase()}`;
    const existing = localStorage.getItem(userKey);
    if (existing) {
      const parsed = JSON.parse(existing);
      const updated = { ...parsed, ...updates };
      localStorage.setItem(userKey, JSON.stringify(updated));
      setUserData(updated);
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

  return {
    userData,
    currentUser,
    updateUserData,
    logActivity,
    updateToolboxStats,
    loadUserData
  };
};
