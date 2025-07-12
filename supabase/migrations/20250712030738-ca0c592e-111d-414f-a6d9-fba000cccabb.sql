-- Enable real-time updates for chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Enable real-time updates for chat_sessions table
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;

-- Add chat_messages table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Add chat_sessions table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;