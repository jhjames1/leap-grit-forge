-- Add missing end_reason column to chat_sessions table if it doesn't exist
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS end_reason text;