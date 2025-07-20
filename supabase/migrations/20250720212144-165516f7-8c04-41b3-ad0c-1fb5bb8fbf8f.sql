-- Add missing last_activity column to chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN last_activity timestamp with time zone;