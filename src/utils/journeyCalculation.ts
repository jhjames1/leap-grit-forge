import { logger } from './logger';
import { journeyManager } from './journeyManager';

interface JourneyProgress {
  completedDays: number[];
  currentWeek: number;
  badges: string[];
  completionDates?: Record<number, string>;
}

interface UserData {
  journeyProgress?: JourneyProgress;
  [key: string]: any;
}

/**
 * Calculates the current journey day based on completed days
 * @param userData - User data containing journey progress
 * @param totalDays - Total number of days in the journey (default: 90)
 * @returns Current day number (1-based)
 */
export const calculateCurrentJourneyDay = (userData: UserData | null, totalDays: number = 90): number => {
  if (!userData) {
    logger.debug('No user data provided for journey day calculation');
    return 1;
  }

  // Ensure journeyProgress exists and has completedDays array
  const journeyProgress = userData.journeyProgress;
  if (!journeyProgress || !Array.isArray(journeyProgress.completedDays)) {
    logger.debug('No journey progress found, defaulting to day 1');
    return 1;
  }

  const completedDays = journeyProgress.completedDays;
  
  // If no days completed, start at day 1
  if (completedDays.length === 0) {
    logger.debug('No completed days found, starting at day 1');
    return 1;
  }

  // Calculate next day based on highest completed day
  const highestCompletedDay = Math.max(...completedDays);
  const nextDay = Math.min(highestCompletedDay + 1, totalDays);
  
  logger.debug('Journey day calculation', {
    completedDaysCount: completedDays.length,
    highestCompletedDay,
    nextDay,
    totalDays
  });

  return nextDay;
};

/**
 * Checks if a specific day is completed
 * @param userData - User data containing journey progress
 * @param day - Day number to check
 * @returns Boolean indicating if the day is completed
 */
export const isDayCompleted = (userData: UserData | null, day: number): boolean => {
  if (!userData?.journeyProgress?.completedDays) {
    return false;
  }
  
  return userData.journeyProgress.completedDays.includes(day);
};

/**
 * Gets the completion status of a day
 * @param userData - User data containing journey progress
 * @param day - Day number to check
 * @returns Status string: 'completed', 'unlocked', or 'locked'
 */
export const getDayStatus = (userData: UserData | null, day: number): 'completed' | 'unlocked' | 'locked' => {
  if (!userData?.journeyProgress?.completedDays) {
    return day === 1 ? 'unlocked' : 'locked';
  }

  const completedDays = userData.journeyProgress.completedDays;
  
  if (completedDays.includes(day)) {
    return 'completed';
  }
  
  // Use journeyManager for consistent unlocking logic
  const completionDates = userData.journeyProgress?.completionDates;
  const completionDatesMap = completionDates ? Object.fromEntries(
    Object.entries(completionDates).map(([k, v]) => [parseInt(k), new Date(v)])
  ) : undefined;
  
  const isUnlocked = journeyManager.isDayUnlocked(completedDays, day, new Date(), completionDatesMap);
  return isUnlocked ? 'unlocked' : 'locked';
};