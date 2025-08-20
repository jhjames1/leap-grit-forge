-- Remove the problematic check constraint
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS check_specialist_status;