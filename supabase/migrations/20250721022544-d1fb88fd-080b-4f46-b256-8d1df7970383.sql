-- Enable real-time for chat_messages table to ensure proper synchronization
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Add chat_messages to the realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Also enable real-time for chat_sessions table to sync session updates
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;