
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

interface UserData {
  firstName: string;
  gratitudeEntries: any[];
  activityLog: ActivityLogEntry[];
  toolboxStats: ToolboxStats;
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
      setUserData(JSON.parse(data));
    }
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
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      details
    };

    const updatedLog = [newActivity, ...userData.activityLog].slice(0, 10); // Keep last 10 activities
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
