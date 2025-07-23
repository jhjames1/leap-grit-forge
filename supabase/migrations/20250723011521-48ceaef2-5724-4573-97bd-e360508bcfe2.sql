-- Fix session creation to ensure new sessions always get unique session numbers
-- Update the start_chat_session_atomic function to properly handle ended sessions

CREATE OR REPLACE FUNCTION start_chat_session_atomic(
  p_user_id UUID
)
RETURNS chat_operation_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  result chat_operation_result;
BEGIN
  -- Check for existing active or waiting sessions ONLY (exclude ended sessions)
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE user_id = p_user_id 
  AND status IN ('active', 'waiting')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If session exists and is stale (waiting > 10 minutes), clean it up
  IF session_record.id IS NOT NULL AND 
     session_record.status = 'waiting' AND 
     session_record.started_at < (now() - interval '10 minutes') THEN
    
    UPDATE chat_sessions 
    SET status = 'ended', ended_at = now(), end_reason = 'auto_timeout'
    WHERE id = session_record.id;
    
    session_record := NULL;
  END IF;
  
  -- Return existing valid session ONLY if it's active or waiting (not ended)
  IF session_record.id IS NOT NULL THEN
    result.success := true;
    result.error_code := 'SESSION_EXISTS';
    result.error_message := 'Active session already exists';
    result.data := to_jsonb(session_record);
    RETURN result;
  END IF;
  
  -- Create new session with automatic session number increment
  -- The session_number column has DEFAULT nextval('session_number_seq'::regclass)
  -- which will automatically assign a unique session number
  INSERT INTO chat_sessions (user_id, status, started_at)
  VALUES (p_user_id, 'waiting', now())
  RETURNING * INTO session_record;
  
  -- Add initial system message
  INSERT INTO chat_messages (
    session_id, sender_id, sender_type, message_type, content
  ) VALUES (
    session_record.id, 
    p_user_id, 
    'system', 
    'system',
    'Chat session started. You are now in the queue to be connected with a Peer Support Specialist.'
  );
  
  -- Log the activity
  INSERT INTO user_activity_logs (user_id, action, type, details)
  VALUES (
    p_user_id,
    'session_started',
    'chat_session',
    json_build_object(
      'session_id', session_record.id,
      'session_number', session_record.session_number
    )::text
  );
  
  result.success := true;
  result.error_code := NULL;
  result.error_message := NULL;
  result.data := to_jsonb(session_record);
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result.success := false;
    result.error_code := 'DB_ERROR';
    result.error_message := SQLERRM;
    result.data := NULL;
    RETURN result;
END;
$$;