
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
   * Check if a session is stale
   */
  isSessionStale(session: { started_at: string; status: string }): boolean {
    if (session.status !== 'waiting') return false;
    
    const sessionAge = Date.now() - new Date(session.started_at).getTime();
    const tenMinutes = 10 * 60 * 1000;
    
    return sessionAge > tenMinutes;
  }

  /**
   * Clean up sessions for a specific user before starting new one
   */
  async cleanupUserSessions(userId: string): Promise<SessionCleanupResult> {
    return this.cleanupStaleSessions(userId);
  }

  /**
   * Schedule periodic cleanup (can be called on app startup)
   */
  schedulePeriodicCleanup(intervalMinutes: number = 15): void {
    const interval = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      try {
        await this.cleanupStaleSessions();
      } catch (error) {
        logger.error('Periodic session cleanup failed:', error);
      }
    }, interval);
    
    logger.debug(`Scheduled periodic session cleanup every ${intervalMinutes} minutes`);
  }
}

export const sessionCleanup = SessionCleanupManager.getInstance();
