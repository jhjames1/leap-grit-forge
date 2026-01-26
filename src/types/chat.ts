// Unified chat types for user and specialist interactions

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: 'user' | 'specialist' | 'system';
  message_type: 'text' | 'quick_action' | 'system' | 'phone_call_request';
  content: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  last_activity?: string;
  end_reason?: string;
  session_number?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
}

export interface SendMessageParams {
  content: string;
  message_type?: ChatMessage['message_type'];
  metadata?: Record<string, any>;
}

export interface ChatHookResult {
  // State
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  
  // Actions
  sendMessage: (params: SendMessageParams) => Promise<void>;
  endSession: (reason?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  forceReconnect: () => void;
}

export interface UserChatHookResult extends ChatHookResult {
  startSession: () => Promise<ChatSession | null>;
  startFreshSession: () => Promise<ChatSession | null>;
  isSessionStale: boolean;
}

export interface SpecialistChatHookResult extends ChatHookResult {
  claimSession: () => Promise<void>;
  specialistId: string | null;
}

// Quick action types for user chat
export type QuickActionType = 'need-support' | 'feeling-triggered' | 'good-day' | 'question';

export const QUICK_ACTION_MESSAGES: Record<QuickActionType, string> = {
  'need-support': "I need support right now. Could you please help me?",
  'feeling-triggered': "I'm feeling triggered and could use some guidance on managing this.",
  'good-day': "Having a good day today! Feeling positive about my recovery journey.",
  'question': "I have a question and would appreciate your guidance."
};
