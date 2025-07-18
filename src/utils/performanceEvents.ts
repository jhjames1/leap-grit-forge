import { supabase } from '@/integrations/supabase/client';

export interface PerformanceEvent {
  event_type: string;
  peer_id?: string;
  session_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export const emitPerformanceEvent = async (event: PerformanceEvent) => {
  try {
    const { error } = await supabase
      .from('peer_performance_events')
      .insert({
        event_type: event.event_type,
        peer_id: event.peer_id || null,
        session_id: event.session_id || null,
        user_id: event.user_id || null,
        metadata: event.metadata || {},
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Error emitting performance event:', error);
    }
  } catch (error) {
    console.error('Error emitting performance event:', error);
  }
};

// Helper functions for specific events
export const emitChatScheduled = (peerId: string, sessionId: string) => {
  return emitPerformanceEvent({
    event_type: 'peer_chat_scheduled',
    peer_id: peerId,
    session_id: sessionId,
  });
};

export const emitChatStarted = (peerId: string, sessionId: string) => {
  return emitPerformanceEvent({
    event_type: 'peer_chat_started',
    peer_id: peerId,
    session_id: sessionId,
  });
};

export const emitChatEnded = (peerId: string, sessionId: string, completed: boolean) => {
  return emitPerformanceEvent({
    event_type: 'peer_chat_ended',
    peer_id: peerId,
    session_id: sessionId,
    metadata: { completed },
  });
};

export const emitChatMessage = (sessionId: string, sender: 'user' | 'peer') => {
  return emitPerformanceEvent({
    event_type: 'chat_message',
    session_id: sessionId,
    metadata: { sender },
  });
};

export const emitPeerRating = (peerId: string, sessionId: string, rating: number) => {
  return emitPerformanceEvent({
    event_type: 'peer_rating',
    peer_id: peerId,
    session_id: sessionId,
    metadata: { rating },
  });
};

export const emitCheckinScheduled = (peerId: string, checkinId: string) => {
  return emitPerformanceEvent({
    event_type: 'peer_checkin_scheduled',
    peer_id: peerId,
    metadata: { checkin_id: checkinId },
  });
};

export const emitCheckinCompleted = (peerId: string, checkinId: string) => {
  return emitPerformanceEvent({
    event_type: 'peer_checkin_completed',
    peer_id: peerId,
    metadata: { checkin_id: checkinId },
  });
};