-- Remove the problematic check constraint that's likely time-based
-- Check constraints with time functions are not immutable and cause issues
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS check_specialist_status;

-- If we need status validation, we can add it as a simple text constraint instead
-- This ensures only valid status values are allowed
ALTER TABLE public.chat_sessions 
ADD CONSTRAINT chat_sessions_status_check 
CHECK (status IN ('waiting', 'active', 'ended', 'cancelled'));