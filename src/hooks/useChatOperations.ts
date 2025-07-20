
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface ChatOperationResult {
  success: boolean;
  error_code?: string;
  error_message?: string;
  data?: any;
}

export interface MessageData {
  content: string;
  sender_type?: 'user' | 'specialist' | 'system';
  message_type?: string;
  metadata?: any;
}

export interface ChatOperationsHook {
  loading: boolean;
  error: string | null;
  startSession: () => Promise<ChatOperationResult>;
  sendMessage: (sessionId: string, messageData: MessageData) => Promise<ChatOperationResult>;
  endSession: (sessionId: string, reason?: string) => Promise<ChatOperationResult>;
  getSessionWithMessages: (sessionId: string) => Promise<any>;
  checkDuplicate: (sessionId: string, content: string) => Promise<boolean>;
  retryOperation: (operation: () => Promise<ChatOperationResult>) => Promise<ChatOperationResult>;
  activateSession: (sessionId: string, specialistId: string) => Promise<ChatOperationResult>;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export const useChatOperations = (): ChatOperationsHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController>();

  const executeWithRetry = useCallback(async (
    operation: () => Promise<any>,
    maxRetries = MAX_RETRIES
  ): Promise<ChatOperationResult> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Cancel any previous operation
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        const result = await operation();
        setError(null);
        return result;
        
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        logger.warn(`Operation attempt ${attempt + 1} failed:`, lastError.message);
        
        // Don't retry on certain error types
        if (lastError.message.includes('PERMISSION_DENIED') || 
            lastError.message.includes('SESSION_NOT_FOUND')) {
          break;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 4000));
        }
      }
    }
    
    const errorMessage = lastError?.message || 'Operation failed after retries';
    setError(errorMessage);
    return {
      success: false,
      error_code: 'RETRY_FAILED',
      error_message: errorMessage
    };
  }, []);

  const startSession = useCallback(async (): Promise<ChatOperationResult> => {
    if (!user) {
      return {
        success: false,
        error_code: 'AUTH_REQUIRED',
        error_message: 'User must be authenticated'
      };
    }

    setLoading(true);
    
    try {
      const result = await executeWithRetry(async () => {
        logger.debug('Starting chat session for user:', user.id);
        
        const { data, error } = await supabase.rpc('start_chat_session_atomic', {
          p_user_id: user.id
        });

        if (error) throw error;
        return data as ChatOperationResult;
      });

      if (result.success) {
        logger.info('Chat session started successfully:', result.data);
        toast({
          title: "Chat Started",
          description: "Your chat session has been started successfully.",
        });
      } else {
        // Handle specific error codes
        if (result.error_code === 'SESSION_EXISTS') {
          toast({
            title: "Session Active",
            description: "You already have an active chat session.",
          });
        } else {
          toast({
            title: "Failed to Start Chat",
            description: result.error_message || "Could not start chat session",
            variant: "destructive",
          });
        }
      }

      return result;
      
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast]);

  const sendMessage = useCallback(async (
    sessionId: string, 
    messageData: MessageData
  ): Promise<ChatOperationResult> => {
    if (!user) {
      return {
        success: false,
        error_code: 'AUTH_REQUIRED',
        error_message: 'User must be authenticated'
      };
    }

    setLoading(true);
    
    try {
      const result = await executeWithRetry(async () => {
        logger.debug('Sending message to session:', sessionId);
        
        // If this is a specialist message, ensure we have proper sender_type
        const finalMessageData = {
          ...messageData,
          sender_type: messageData.sender_type || 'user'
        };
        
        const { data, error } = await supabase.rpc('send_message_atomic', {
          p_session_id: sessionId,
          p_sender_id: user.id,
          p_sender_type: finalMessageData.sender_type,
          p_content: finalMessageData.content,
          p_message_type: finalMessageData.message_type || 'text',
          p_metadata: finalMessageData.metadata || null
        });

        if (error) throw error;
        return data as ChatOperationResult;
      });

      if (!result.success) {
        // Handle specific error codes
        switch (result.error_code) {
          case 'SESSION_NOT_FOUND':
            toast({
              title: "Session Not Found",
              description: "The chat session could not be found.",
              variant: "destructive",
            });
            break;
          case 'SESSION_ENDED':
            toast({
              title: "Session Ended",
              description: "Cannot send message to an ended session.",
              variant: "destructive",
            });
            break;
          case 'PERMISSION_DENIED':
            toast({
              title: "Permission Denied",
              description: "You don't have permission to send messages in this session.",
              variant: "destructive",
            });
            break;
          default:
            logger.error('Message send failed:', result);
        }
      } else {
        logger.debug('Message sent successfully:', result.data);
      }

      return result;
      
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast]);

  const activateSession = useCallback(async (
    sessionId: string,
    specialistId: string
  ): Promise<ChatOperationResult> => {
    if (!user) {
      return {
        success: false,
        error_code: 'AUTH_REQUIRED',
        error_message: 'User must be authenticated'
      };
    }

    setLoading(true);
    
    try {
      logger.debug('Activating session:', { sessionId, specialistId });
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'active',
          specialist_id: specialistId,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('status', 'waiting') // Only activate waiting sessions
        .select()
        .single();

      if (error) throw error;

      logger.info('Session activated successfully:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (err) {
      logger.error('Failed to activate session:', err);
      return {
        success: false,
        error_code: 'ACTIVATION_FAILED',
        error_message: err instanceof Error ? err.message : 'Failed to activate session'
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const endSession = useCallback(async (
    sessionId: string, 
    reason?: string
  ): Promise<ChatOperationResult> => {
    if (!user) {
      return {
        success: false,
        error_code: 'AUTH_REQUIRED',
        error_message: 'User must be authenticated'
      };
    }

    setLoading(true);
    
    try {
      const result = await executeWithRetry(async () => {
        logger.debug('Ending chat session:', sessionId);
        
        const { data, error } = await supabase.rpc('end_chat_session_atomic', {
          p_session_id: sessionId,
          p_user_id: user.id,
          p_end_reason: reason || 'manual'
        });

        if (error) throw error;
        return data as ChatOperationResult;
      });

      if (result.success) {
        if (result.error_code === 'ALREADY_ENDED') {
          toast({
            title: "Session Already Ended",
            description: "This session was already ended.",
          });
        } else {
          toast({
            title: "Session Ended",
            description: "Chat session has been ended successfully.",
          });
        }
      } else {
        toast({
          title: "Failed to End Session",
          description: result.error_message || "Could not end chat session",
          variant: "destructive",
        });
      }

      return result;
      
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast]);

  const getSessionWithMessages = useCallback(async (sessionId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_session_with_messages', {
        p_session_id: sessionId,
        p_user_id: user.id
      });

      if (error) throw error;
      return data;
      
    } catch (err) {
      logger.error('Failed to get session with messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      return null;
    }
  }, [user]);

  const checkDuplicate = useCallback(async (
    sessionId: string, 
    content: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_message_duplicate', {
        p_session_id: sessionId,
        p_sender_id: user.id,
        p_content: content
      });

      if (error) throw error;
      return data || false;
      
    } catch (err) {
      logger.error('Failed to check duplicate:', err);
      return false;
    }
  }, [user]);

  const retryOperation = useCallback(async (
    operation: () => Promise<ChatOperationResult>
  ): Promise<ChatOperationResult> => {
    return executeWithRetry(operation);
  }, [executeWithRetry]);

  return {
    loading,
    error,
    startSession,
    sendMessage,
    endSession,
    getSessionWithMessages,
    checkDuplicate,
    retryOperation,
    activateSession
  };
};
