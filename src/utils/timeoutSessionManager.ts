import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

export interface SessionTimeoutEvent {
  sessionId: string;
  reason: 'auto_timeout' | 'inactivity_timeout';
  endedAt: string;
  sessionNumber?: number;
}

export interface SessionTimeoutCallback {
  (event: SessionTimeoutEvent): void;
}

class TimeoutSessionManager {
  private callbacks: Set<SessionTimeoutCallback> = new Set();
  private timeoutTimer: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Subscribe to timeout events
   */
  public subscribe(callback: SessionTimeoutCallback): () => void {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of a timeout event
   */
  private notifyTimeoutEvent(event: SessionTimeoutEvent): void {
    logger.debug('TimeoutSessionManager: Notifying timeout event', event);
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('TimeoutSessionManager: Error in timeout callback', error);
      }
    });
  }

  /**
   * Handle when a session times out
   */
  public handleSessionTimeout(sessionId: string, reason: 'auto_timeout' | 'inactivity_timeout', sessionNumber?: number): void {
    const event: SessionTimeoutEvent = {
      sessionId,
      reason,
      endedAt: new Date().toISOString(),
      sessionNumber
    };

    logger.debug('TimeoutSessionManager: Handling session timeout', event);
    this.notifyTimeoutEvent(event);
  }

  /**
   * Monitor for session timeouts by watching database changes
   */
  public startMonitoring(specialistId?: string): void {
    if (this.isMonitoring) {
      logger.debug('TimeoutSessionManager: Already monitoring');
      return;
    }

    this.isMonitoring = true;
    logger.debug('TimeoutSessionManager: Starting timeout monitoring', { specialistId });

    // Set up realtime subscription for session updates
    const channel = supabase
      .channel('timeout-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: specialistId ? `specialist_id=eq.${specialistId}` : undefined
        },
        (payload) => {
          const updatedSession = payload.new as any;
          
          // Check if this is a timeout event
          if (updatedSession.status === 'ended' && 
              (updatedSession.end_reason === 'auto_timeout' || updatedSession.end_reason === 'inactivity_timeout')) {
            
            logger.debug('TimeoutSessionManager: Detected timeout session', {
              sessionId: updatedSession.id,
              reason: updatedSession.end_reason,
              sessionNumber: updatedSession.session_number
            });

            this.handleSessionTimeout(
              updatedSession.id,
              updatedSession.end_reason,
              updatedSession.session_number
            );
          }
        }
      )
      .subscribe();

    // Store channel reference for cleanup
    (this as any).monitoringChannel = channel;
  }

  /**
   * Stop monitoring for timeouts
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    logger.debug('TimeoutSessionManager: Stopping timeout monitoring');

    if ((this as any).monitoringChannel) {
      supabase.removeChannel((this as any).monitoringChannel);
      (this as any).monitoringChannel = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  /**
   * Schedule auto-removal of ended sessions from UI after delay
   */
  public scheduleSessionRemoval(sessionId: string, delay: number = 5000): void {
    logger.debug('TimeoutSessionManager: Scheduling session removal', { sessionId, delay });
    
    setTimeout(() => {
      logger.debug('TimeoutSessionManager: Session removal timer triggered', { sessionId });
      
      // Emit a removal event
      this.notifyTimeoutEvent({
        sessionId,
        reason: 'auto_timeout',
        endedAt: new Date().toISOString()
      });
    }, delay);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopMonitoring();
    this.callbacks.clear();
  }
}

// Global instance
export const timeoutSessionManager = new TimeoutSessionManager();

/**
 * Hook for React components to subscribe to timeout events
 */
export const useTimeoutSessionManager = (callback: SessionTimeoutCallback, specialistId?: string) => {
  const subscribeToTimeouts = () => {
    const unsubscribe = timeoutSessionManager.subscribe(callback);
    
    // Start monitoring if a specialist ID is provided
    if (specialistId) {
      timeoutSessionManager.startMonitoring(specialistId);
    }
    
    return unsubscribe;
  };

  return {
    subscribeToTimeouts,
    scheduleRemoval: (sessionId: string, delay?: number) => 
      timeoutSessionManager.scheduleSessionRemoval(sessionId, delay),
    handleTimeout: (sessionId: string, reason: 'auto_timeout' | 'inactivity_timeout', sessionNumber?: number) =>
      timeoutSessionManager.handleSessionTimeout(sessionId, reason, sessionNumber)
  };
};