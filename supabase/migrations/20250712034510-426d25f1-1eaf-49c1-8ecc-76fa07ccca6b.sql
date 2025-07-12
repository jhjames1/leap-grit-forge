-- Enable real-time for chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;