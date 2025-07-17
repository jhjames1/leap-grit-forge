import { SecureStorage } from './secureStorage';
import { logger } from './logger';
import { logSecurityEvent } from './security';

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  actionsToday: number;
  toolsUsedToday: number;
  journeyActivitiesCompleted: number;
  recoveryStrength: number; // 0-100
  wellnessLevel: 'Good' | 'Fair' | 'Needs Attention';
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
  type: 'journey' | 'tool' | 'peer' | 'general';
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export class TrackingManager {
  private static instance: TrackingManager;
  private username: string | null = null;

  private constructor() {
    // Initialize with current user
    this.initializeUser();
  }

  public static getInstance(): TrackingManager {
    if (!TrackingManager.instance) {
      TrackingManager.instance = new TrackingManager();
    }
    return TrackingManager.instance;
  }

  private initializeUser(): void {
    // Try to get current user from secure session first, then localStorage
    const session = JSON.parse(localStorage.getItem('secureSession') || 'null');
    this.username = session?.username || localStorage.getItem('currentUser');
    
    if (this.username) {
      this.ensureDailyStatsExist();
      this.initializeStreakFromJourney();
    }
  }

  public setUser(username: string): void {
    this.username = username;
    this.ensureDailyStatsExist();
    this.initializeStreakFromJourney();
  }

  /**
   * Get today's stats, creating if they don't exist
   */
  public getTodaysStats(): DailyStats {
    if (!this.username) {
      throw new Error('No user set for tracking');
    }

    const today = this.getTodayDateString();
    const userData = SecureStorage.getUserData(this.username);
    
    if (!userData?.dailyStats?.[today]) {
      this.initializeTodaysStats();
    }

    return userData?.dailyStats?.[today] || this.createEmptyDailyStats(today);
  }

  /**
   * Update recovery strength based on completed activities
   */
  public updateRecoveryStrength(): void {
    if (!this.username) return;

    const today = this.getTodayDateString();
    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return;

    const todaysStats = userData.dailyStats?.[today];
    if (!todaysStats) return;

    // Calculate total possible activities for today (journey + tools)
    const totalPossibleActivities = this.getTotalPossibleActivitiesForToday();
    const completedActivities = todaysStats.actionsToday;
    
    // Calculate recovery strength percentage
    const recoveryStrength = totalPossibleActivities > 0 
      ? Math.round((completedActivities / totalPossibleActivities) * 100)
      : 0;

    // Determine wellness level
    let wellnessLevel: 'Good' | 'Fair' | 'Needs Attention' = 'Needs Attention';
    if (recoveryStrength === 100) {
      wellnessLevel = 'Good';
    } else if (recoveryStrength >= 50) {
      wellnessLevel = 'Fair';
    }

    // Update stats
    const updatedStats: DailyStats = {
      ...todaysStats,
      recoveryStrength,
      wellnessLevel
    };

    this.updateTodaysStats(updatedStats);
    
    logger.debug('Recovery strength updated', {
      username: this.username,
      recoveryStrength,
      wellnessLevel,
      completedActivities,
      totalPossibleActivities
    });
  }

  /**
   * Log an activity and update tracking
   */
  public logActivity(
    action: string, 
    type: 'journey' | 'tool' | 'peer' | 'general' = 'general',
    details?: string
  ): void {
    if (!this.username) return;

    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return;

    // Create activity log entry
    const logEntry: ActivityLogEntry = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      details,
      type
    };

    // Update activity log
    const updatedLog = [logEntry, ...(userData.activityLog || [])].slice(0, 100); // Keep last 100 activities
    
    // Update today's stats
    const today = this.getTodayDateString();
    const todaysStats = userData.dailyStats?.[today] || this.createEmptyDailyStats(today);
    
    todaysStats.actionsToday += 1;
    
    if (type === 'journey') {
      todaysStats.journeyActivitiesCompleted += 1;
    } else if (type === 'tool') {
      todaysStats.toolsUsedToday += 1;
    }

    // Save updated data
    const updatedData = {
      ...userData,
      activityLog: updatedLog,
      dailyStats: {
        ...userData.dailyStats,
        [today]: todaysStats
      },
      lastAccess: Date.now()
    };

    SecureStorage.setUserData(this.username, updatedData);
    
    // Update recovery strength
    this.updateRecoveryStrength();
    
    // Update streak
    this.updateStreak();

    logSecurityEvent('activity_logged', { 
      username: this.username, 
      action, 
      type 
    });

    logger.debug('Activity logged', { 
      username: this.username, 
      action, 
      type,
      todaysActions: todaysStats.actionsToday 
    });
  }

  /**
   * Get current streak data
   */
  public getStreakData(): StreakData {
    if (!this.username) {
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: '' };
    }

    const userData = SecureStorage.getUserData(this.username);
    return userData?.streakData || { currentStreak: 0, longestStreak: 0, lastActivityDate: '' };
  }

  /**
   * Initialize streak data from journey progress
   */
  private initializeStreakFromJourney(): void {
    if (!this.username) return;

    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return;

    const completionDates = userData.journeyProgress?.completionDates || {};
    const completedDays = userData.journeyProgress?.completedDays || [];
    
    if (completedDays.length === 0) return;

    // Convert completion dates to sorted array of date strings
    const sortedCompletionDates = completedDays
      .map(day => completionDates[day] || new Date().toISOString())
      .map(dateStr => this.getDateString(new Date(dateStr)))
      .sort();

    // Calculate current streak from journey completions
    const currentStreak = this.calculateStreakFromDates(sortedCompletionDates);
    const longestStreak = Math.max(currentStreak, userData.streakData?.longestStreak || 0);
    const lastActivityDate = sortedCompletionDates[sortedCompletionDates.length - 1] || '';

    const streakData = {
      currentStreak,
      longestStreak,
      lastActivityDate
    };

    // Save updated streak data
    const updatedData = {
      ...userData,
      streakData,
      lastAccess: Date.now()
    };

    SecureStorage.setUserData(this.username, updatedData);
  }

  /**
   * Calculate streak from array of date strings
   */
  private calculateStreakFromDates(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;

    const today = this.getTodayDateString();
    const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    // Check if streak is still active (completed today or yesterday)
    const lastDate = sortedDates[sortedDates.length - 1];
    const isActive = lastDate === today || lastDate === yesterday;
    
    if (!isActive) return 0;

    // Count consecutive days from the end
    let streak = 0;
    let expectedDate = new Date(lastDate);
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const currentDate = sortedDates[i];
      const expectedDateStr = this.getDateString(expectedDate);
      
      if (currentDate === expectedDateStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Update streak based on daily activity and journey completion
   */
  private updateStreak(): void {
    if (!this.username) return;

    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return;

    const today = this.getTodayDateString();
    const streakData = userData.streakData || { currentStreak: 0, longestStreak: 0, lastActivityDate: '' };
    
    // Check if user had activity today (either activity log or journey completion)
    const todaysStats = userData.dailyStats?.[today];
    const hasActivityToday = (todaysStats?.actionsToday || 0) > 0;
    
    // Also check if today is a completed journey day
    const currentDay = this.getCurrentJourneyDay(userData);
    const isJourneyDayCompleted = userData.journeyProgress?.completedDays?.includes(currentDay);
    
    const hasAnyActivityToday = hasActivityToday || isJourneyDayCompleted;

    if (hasAnyActivityToday) {
      const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      if (streakData.lastActivityDate === yesterday) {
        // Continuing streak
        streakData.currentStreak += 1;
      } else if (streakData.lastActivityDate !== today) {
        // Starting new streak or gap - recalculate from journey progress
        this.initializeStreakFromJourney();
        return;
      }
      // If lastActivityDate === today, we've already counted today
      
      streakData.lastActivityDate = today;
      streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
    }

    // Save updated streak data
    const updatedData = {
      ...userData,
      streakData,
      lastAccess: Date.now()
    };

    SecureStorage.setUserData(this.username, updatedData);
  }

  /**
   * Get calendar data for streak visualization
   */
  public getCalendarData(monthsBack: number = 2): Record<string, 'completed' | 'missed'> {
    if (!this.username) return {};

    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return {};

    const calendarData: Record<string, 'completed' | 'missed'> = {};
    const now = new Date();
    const userCreatedDate = new Date(userData.createdAt || now);
    
    // Get journey completion dates
    const completionDates = userData.journeyProgress?.completionDates || {};
    const completedDays = userData.journeyProgress?.completedDays || [];
    
    // Create set of journey completion date strings for quick lookup
    const journeyCompletionDates = new Set(
      completedDays.map(day => {
        const completionDate = completionDates[day];
        return completionDate ? this.getDateString(new Date(completionDate)) : null;
      }).filter(Boolean)
    );
    
    // Go back specified months but not before user creation
    for (let i = 0; i < monthsBack * 31; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Don't include dates before user was created
      if (date < userCreatedDate) break;
      
      const dateString = this.getDateString(date);
      
      // Only include dates from the past (not today or future)
      if (date.toDateString() !== now.toDateString() && date < now) {
        // Check if this date has journey completion or activity
        const dayStats = userData.dailyStats?.[dateString];
        const hasActivity = dayStats && dayStats.actionsToday > 0;
        const hasJourneyCompletion = journeyCompletionDates.has(dateString);
        
        if (hasActivity || hasJourneyCompletion) {
          calendarData[dateString] = 'completed';
        } else {
          calendarData[dateString] = 'missed';
        }
      }
    }

    return calendarData;
  }

  /**
   * Reset daily stats at midnight
   */
  public checkAndResetDaily(): void {
    const now = new Date();
    const lastReset = localStorage.getItem('lastDailyReset');
    const today = this.getTodayDateString();

    if (lastReset !== today) {
      // It's a new day, ensure today's stats exist
      this.ensureDailyStatsExist();
      localStorage.setItem('lastDailyReset', today);
      
      logger.debug('Daily reset performed', { 
        today, 
        lastReset,
        username: this.username 
      });
    }
  }

  private ensureDailyStatsExist(): void {
    if (!this.username) return;

    const today = this.getTodayDateString();
    const userData = SecureStorage.getUserData(this.username);
    
    if (!userData?.dailyStats?.[today]) {
      this.initializeTodaysStats();
    }
  }

  private initializeTodaysStats(): void {
    if (!this.username) return;

    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return;

    const today = this.getTodayDateString();
    const todaysStats = this.createEmptyDailyStats(today);

    const updatedData = {
      ...userData,
      dailyStats: {
        ...userData.dailyStats,
        [today]: todaysStats
      }
    };

    SecureStorage.setUserData(this.username, updatedData);
  }

  private updateTodaysStats(stats: DailyStats): void {
    if (!this.username) return;

    const userData = SecureStorage.getUserData(this.username);
    if (!userData) return;

    const updatedData = {
      ...userData,
      dailyStats: {
        ...userData.dailyStats,
        [stats.date]: stats
      }
    };

    SecureStorage.setUserData(this.username, updatedData);
  }

  private createEmptyDailyStats(date: string): DailyStats {
    return {
      date,
      actionsToday: 0,
      toolsUsedToday: 0,
      journeyActivitiesCompleted: 0,
      recoveryStrength: 0,
      wellnessLevel: 'Needs Attention'
    };
  }

  private getTodayDateString(): string {
    return this.getDateString(new Date());
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private getTotalPossibleActivitiesForToday(): number {
    // This could be dynamic based on the user's journey and available tools
    // For now, assuming 1 journey activity + up to 4 tool uses per day
    return 5;
  }

  /**
   * Get current journey day for the user
   */
  private getCurrentJourneyDay(userData: any): number {
    if (!userData?.journeyProgress?.completedDays) return 1;
    
    const completedDays = userData.journeyProgress.completedDays;
    if (completedDays.length === 0) return 1;
    
    const highestCompletedDay = Math.max(...completedDays);
    return Math.min(highestCompletedDay + 1, 90); // Assuming 90 day journey
  }
}

export const trackingManager = TrackingManager.getInstance();