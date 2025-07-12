-- Check and set REPLICA IDENTITY for chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;