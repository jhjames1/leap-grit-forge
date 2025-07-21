
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SessionCleanupResult {
  success: boolean;
  cleanedSessions: number;
  error?: string;
}

export class SessionCleanupManager {
  private static instance: SessionCleanupManager;
  private isRunning = false;
  
  static getInstance(): SessionCleanupManager {
    if (!SessionCleanupManager.instance) {
      SessionCleanupManager.instance = new SessionCleanupManager();
    }
    return SessionCleanupManager.instance;
  }

  /**
   * Clean up stale waiting sessions (older than 10 minutes)
   */
  async cleanupStaleSessions(userId?: string): Promise<SessionCleanupResult> {
    if (this.isRunning) {
      return { success: false, cleanedSessions: 0, error: 'Cleanup already running' };
    }

    this.isRunning = true;
    
    try {
      logger.debug('Starting session cleanup', { userId });
      
      const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      
      let query = supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
          end_reason: 'auto_timeout'
        })
        .eq('status', 'waiting')
        .lt('started_at', staleThreshold);
      
      // If userId provided, only clean that user's sessions
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error, count } = await query.select();
      
      if (error) {
        throw error;
      }
      
      const cleanedCount = count || 0;
      
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} stale sessions`);
      }
      
      return {
        success: true,
        cleanedSessions: cleanedCount
      };
      
    } catch (error) {
      logger.error('Session cleanup failed:', error);
      return {
        success: false,
        cleanedSessions: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clean up inactive active sessions (older than 5 minutes)
   */
  async cleanupInactiveSessions(userId?: string): Promise<SessionCleanupResult> {
    if (this.isRunning) {
      return { success: false, cleanedSessions: 0, error: 'Cleanup already running' };
    }

    this.isRunning = true;
    
    try {
      logger.debug('Starting inactive session cleanup', { userId });
      
      const inactiveThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      
      let query = supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
          end_reason: 'inactivity_timeout'
        })
        .eq('status', 'active')
        .lt('last_activity', inactiveThreshold);
      
      // If userId provided, only clean that user's sessions
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error, count } = await query.select();
      
      if (error) {
        throw error;
      }
      
      const cleanedCount = count || 0;
      
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} inactive sessions`);
      }
      
      return {
        success: true,
        cleanedSessions: cleanedCount
      };
      
    } catch (error) {
      logger.error('Inactive session cleanup failed:', error);
      return {
        success: false,
        cleanedSessions: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if a session is stale
   */
  isSessionStale(session: { started_at: string; status: string }): boolean {
    if (session.status !== 'waiting') return false;
    
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    const tenMinutes = 10 * 60 * 1000;
    
    return sessionAge > tenMinutes;
  }

  /**
   * Check if a session is inactive (for active sessions)
   */
  isSessionInactive(session: { last_activity?: string; status: string }): boolean {
    if (session.status !== 'active' || !session.last_activity) return false;
    
    const inactiveTime = Date.now() - new Date(session.last_activity).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return inactiveTime > fiveMinutes;
  }

  /**
   * Get time until session becomes inactive (in seconds)
   */
  getTimeUntilInactive(session: { last_activity?: string; status: string }): number {
    if (session.status !== 'active' || !session.last_activity) return 0;
    
    const inactiveTime = Date.now() - new Date(session.last_activity).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    const remaining = fiveMinutes - inactiveTime;
    
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Clean up sessions for a specific user before starting new one
   */
  async cleanupUserSessions(userId: string): Promise<SessionCleanupResult> {
    const staleResult = await this.cleanupStaleSessions(userId);
    const inactiveResult = await this.cleanupInactiveSessions(userId);
    
    return {
      success: staleResult.success && inactiveResult.success,
      cleanedSessions: staleResult.cleanedSessions + inactiveResult.cleanedSessions,
      error: staleResult.error || inactiveResult.error
    };
  }

  /**
   * Schedule periodic cleanup (can be called on app startup)
   */
  schedulePeriodicCleanup(intervalMinutes: number = 15): void {
    const interval = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      try {
        await this.cleanupStaleSessions();
        await this.cleanupInactiveSessions();
      } catch (error) {
        logger.error('Periodic session cleanup failed:', error);
      }
    }, interval);
    
    logger.debug(`Scheduled periodic session cleanup every ${intervalMinutes} minutes`);
  }
}

export const sessionCleanup = SessionCleanupManager.getInstance();
