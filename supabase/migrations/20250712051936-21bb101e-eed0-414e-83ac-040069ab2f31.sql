-- Add columns for session tracking and auto-ending
ALTER TABLE public.chat_sessions 
ADD COLUMN last_activity timestamp with time zone DEFAULT now(),
ADD COLUMN end_reason text;

-- Update existing sessions to have last_activity set
UPDATE public.chat_sessions 
SET last_activity = COALESCE(ended_at, updated_at, created_at)
WHERE last_activity IS NULL;

-- Create function to auto-end inactive sessions
CREATE OR REPLACE FUNCTION auto_end_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update sessions that have been inactive for more than 5 minutes
  UPDATE public.chat_sessions 
  SET 
    status = 'ended',
    ended_at = now(),
    end_reason = 'auto_timeout',
    updated_at = now()
  WHERE 
    status IN ('active', 'waiting') 
    AND last_activity < (now() - interval '5 minutes');
    
  -- Insert system messages for auto-ended sessions
  INSERT INTO public.chat_messages (session_id, sender_id, sender_type, message_type, content)
  SELECT 
    cs.id,
    cs.user_id,
    'system',
    'system',
    'This chat session has been automatically ended due to inactivity.'
  FROM public.chat_sessions cs
  WHERE 
    cs.status = 'ended' 
    AND cs.end_reason = 'auto_timeout'
    AND cs.ended_at > (now() - interval '1 minute')
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_messages cm 
      WHERE cm.session_id = cs.id 
      AND cm.sender_type = 'system' 
      AND cm.content LIKE '%automatically ended%'
    );
END;
$$;

-- Create trigger to update last_activity when messages are sent
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chat_sessions 
  SET last_activity = now(), updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

-- Create trigger for message inserts
DROP TRIGGER IF EXISTS update_session_activity_trigger ON public.chat_messages;
CREATE TRIGGER update_session_activity_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto-end function to run every minute
SELECT cron.schedule(
  'auto-end-inactive-sessions',
  '* * * * *',
  'SELECT auto_end_inactive_sessions();'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status_activity 
ON public.chat_sessions(status, last_activity);

-- Enable real-time for chat_sessions table
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.chat_sessions;