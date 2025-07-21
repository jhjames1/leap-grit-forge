-- Enable realtime for chat_sessions table with full replica identity
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;

-- Also enable for chat_messages table  
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;