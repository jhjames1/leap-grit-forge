
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SessionStateTransition {
  from: 'waiting' | 'active' | 'ended';
  to: 'waiting' | 'active' | 'ended';
  sessionId: string;
  specialistId?: string;
  userId: string;
  reason?: string;
}

export class SessionStateManager {
  private static instance: SessionStateManager;
  private transitionQueue: SessionStateTransition[] = [];
  private processing = false;

  static getInstance(): SessionStateManager {
    if (!SessionStateManager.instance) {
      SessionStateManager.instance = new SessionStateManager();
    }
    return SessionStateManager.instance;
  }

  /**
   * Validate if a state transition is allowed
   */
  private validateTransition(from: string, to: string): boolean {
    const validTransitions = {
      'waiting': ['active', 'ended'],
      'active': ['ended'],
      'ended': [] // No transitions from ended state
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Queue a state transition for processing
   */
  async queueTransition(transition: SessionStateTransition): Promise<void> {
    // Validate transition
    if (!this.validateTransition(transition.from, transition.to)) {
      throw new Error(`Invalid state transition from ${transition.from} to ${transition.to}`);
    }

    this.transitionQueue.push(transition);
    
    // Process queue if not already processing
    if (!this.processing) {
      await this.processQueue();
    }
  }

  /**
   * Process the transition queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.transitionQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.transitionQueue.length > 0) {
        const transition = this.transitionQueue.shift()!;
        await this.executeTransition(transition);
      }
    } catch (error) {
      logger.error('Error processing transition queue', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a single state transition
   */
  private async executeTransition(transition: SessionStateTransition): Promise<void> {
    const { sessionId, to, specialistId, userId, reason } = transition;

    try {
      logger.debug('Executing session state transition', {
        sessionId,
        from: transition.from,
        to,
        specialistId,
        reason
      });

      // Build update data
      const updateData: any = {
        status: to,
        updated_at: new Date().toISOString()
      };

      // Add specialist assignment if provided
      if (specialistId && to === 'active') {
        updateData.specialist_id = specialistId;
      }

      // Add end timestamp if ending session
      if (to === 'ended') {
        updateData.ended_at = new Date().toISOString();
      }

      // Update the session in database
      const { data, error } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the transition
      await this.logTransition(transition, data);

      logger.debug('Session state transition completed successfully', {
        sessionId,
        newStatus: to,
        data
      });

    } catch (error) {
      logger.error('Failed to execute session state transition', {
        sessionId,
        transition,
        error
      });
      throw error;
    }
  }

  /**
   * Log the state transition for audit purposes
   */
  private async logTransition(transition: SessionStateTransition, sessionData: any): Promise<void> {
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: transition.userId,
          action: 'session_state_transition',
          type: 'chat_session',
          details: JSON.stringify({
            session_id: transition.sessionId,
            from_status: transition.from,
            to_status: transition.to,
            specialist_id: transition.specialistId,
            reason: transition.reason,
            timestamp: new Date().toISOString(),
            session_data: sessionData
          })
        });
    } catch (error) {
      logger.error('Failed to log session state transition', error);
      // Don't throw here - logging failure shouldn't break the transition
    }
  }

  /**
   * Get current session state
   */
  async getSessionState(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get session state', { sessionId, error });
      throw error;
    }
  }

  /**
   * Activate a waiting session
   */
  async activateSession(sessionId: string, specialistId: string, userId: string): Promise<any> {
    const currentState = await this.getSessionState(sessionId);
    
    if (currentState.status !== 'waiting') {
      throw new Error(`Cannot activate session in ${currentState.status} state`);
    }

    await this.queueTransition({
      from: 'waiting',
      to: 'active',
      sessionId,
      specialistId,
      userId,
      reason: 'Specialist sent first message'
    });

    return await this.getSessionState(sessionId);
  }

  /**
   * End an active session
   */
  async endSession(sessionId: string, userId: string, reason?: string): Promise<any> {
    const currentState = await this.getSessionState(sessionId);
    
    if (currentState.status === 'ended') {
      throw new Error('Session is already ended');
    }

    await this.queueTransition({
      from: currentState.status,
      to: 'ended',
      sessionId,
      userId,
      reason: reason || 'Session ended by specialist'
    });

    return await this.getSessionState(sessionId);
  }
}

export const sessionStateManager = SessionStateManager.getInstance();
