
-- Phase 1: Database Layer Hardening - Create atomic chat operation functions

-- Create enum for chat operation results
CREATE TYPE chat_operation_result AS (
  success BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  data JSONB
);

-- Atomic function to start a chat session with proper error handling
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
  -- Check for existing active or waiting sessions
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
  
  -- Return existing valid session
  IF session_record.id IS NOT NULL THEN
    result.success := true;
    result.error_code := 'SESSION_EXISTS';
    result.error_message := 'Active session already exists';
    result.data := to_jsonb(session_record);
    RETURN result;
  END IF;
  
  -- Create new session
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
    json_build_object('session_id', session_record.id)::text
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

-- Atomic function to send message and activate session if needed
CREATE OR REPLACE FUNCTION send_message_atomic(
  p_session_id UUID,
  p_sender_id UUID,
  p_sender_type TEXT,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_metadata JSONB DEFAULT NULL
)
RETURNS chat_operation_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  specialist_record RECORD;
  message_record RECORD;
  result chat_operation_result;
BEGIN
  -- Get session with lock to prevent race conditions
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE id = p_session_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    result.success := false;
    result.error_code := 'SESSION_NOT_FOUND';
    result.error_message := 'Chat session not found';
    result.data := NULL;
    RETURN result;
  END IF;
  
  -- If session is ended, reject message
  IF session_record.status = 'ended' THEN
    result.success := false;
    result.error_code := 'SESSION_ENDED';
    result.error_message := 'Cannot send message to ended session';
    result.data := NULL;
    RETURN result;
  END IF;
  
  -- If this is a specialist's first message to a waiting session, activate it
  IF p_sender_type = 'specialist' AND session_record.status = 'waiting' THEN
    -- Get specialist ID
    SELECT id INTO specialist_record
    FROM peer_specialists
    WHERE user_id = p_sender_id AND is_active = true AND is_verified = true;
    
    IF NOT FOUND THEN
      result.success := false;
      result.error_code := 'SPECIALIST_NOT_FOUND';
      result.error_message := 'Specialist not found or not verified';
      result.data := NULL;
      RETURN result;
    END IF;
    
    -- Activate session and assign specialist
    UPDATE chat_sessions
    SET status = 'active', specialist_id = specialist_record.id, updated_at = now()
    WHERE id = p_session_id;
    
    session_record.status := 'active';
    session_record.specialist_id := specialist_record.id;
  END IF;
  
  -- Verify sender has permission to send messages in this session
  IF p_sender_type = 'user' AND session_record.user_id != p_sender_id THEN
    result.success := false;
    result.error_code := 'PERMISSION_DENIED';
    result.error_message := 'User not authorized for this session';
    result.data := NULL;
    RETURN result;
  END IF;
  
  IF p_sender_type = 'specialist' THEN
    SELECT ps.id INTO specialist_record
    FROM peer_specialists ps
    WHERE ps.user_id = p_sender_id AND ps.id = session_record.specialist_id;
    
    IF NOT FOUND THEN
      result.success := false;
      result.error_code := 'PERMISSION_DENIED';
      result.error_message := 'Specialist not authorized for this session';
      result.data := NULL;
      RETURN result;
    END IF;
  END IF;
  
  -- Insert the message
  INSERT INTO chat_messages (
    session_id, sender_id, sender_type, message_type, content, metadata
  ) VALUES (
    p_session_id, p_sender_id, p_sender_type, p_message_type, p_content, p_metadata
  )
  RETURNING * INTO message_record;
  
  -- Update session activity
  UPDATE chat_sessions
  SET last_activity = now(), updated_at = now()
  WHERE id = p_session_id;
  
  result.success := true;
  result.error_code := NULL;
  result.error_message := NULL;
  result.data := jsonb_build_object(
    'message', to_jsonb(message_record),
    'session', to_jsonb(session_record)
  );
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

-- Enhanced end_chat_session function with better error handling
CREATE OR REPLACE FUNCTION end_chat_session_atomic(
  p_session_id UUID,
  p_user_id UUID,
  p_end_reason TEXT DEFAULT 'manual'
)
RETURNS chat_operation_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  specialist_record RECORD;
  result chat_operation_result;
BEGIN
  -- Get session with lock
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE id = p_session_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    result.success := false;
    result.error_code := 'SESSION_NOT_FOUND';
    result.error_message := 'Chat session not found';
    result.data := NULL;
    RETURN result;
  END IF;
  
  -- Check permissions
  IF session_record.user_id != p_user_id THEN
    -- Check if user is the assigned specialist
    SELECT ps.id INTO specialist_record
    FROM peer_specialists ps
    WHERE ps.user_id = p_user_id AND ps.id = session_record.specialist_id;
    
    IF NOT FOUND THEN
      result.success := false;
      result.error_code := 'PERMISSION_DENIED';
      result.error_message := 'Not authorized to end this session';
      result.data := NULL;
      RETURN result;
    END IF;
  END IF;
  
  -- If already ended, return success with existing data
  IF session_record.status = 'ended' THEN
    result.success := true;
    result.error_code := 'ALREADY_ENDED';
    result.error_message := 'Session was already ended';
    result.data := to_jsonb(session_record);
    RETURN result;
  END IF;
  
  -- End the session
  UPDATE chat_sessions
  SET status = 'ended', ended_at = now(), end_reason = p_end_reason, updated_at = now()
  WHERE id = p_session_id
  RETURNING * INTO session_record;
  
  -- Cancel any pending appointment proposals
  UPDATE appointment_proposals
  SET status = 'expired', responded_at = now()
  WHERE chat_session_id = p_session_id AND status = 'pending';
  
  -- Add final system message
  INSERT INTO chat_messages (
    session_id, sender_id, sender_type, message_type, content
  ) VALUES (
    p_session_id,
    p_user_id,
    'system',
    'system',
    CASE 
      WHEN p_end_reason = 'auto_timeout' THEN 'This chat session has been automatically ended due to inactivity.'
      ELSE 'This chat session has been ended. Thank you for using our service.'
    END
  );
  
  -- Log the activity
  INSERT INTO user_activity_logs (user_id, action, type, details)
  VALUES (
    p_user_id,
    'session_ended',
    'chat_session',
    json_build_object(
      'session_id', p_session_id,
      'end_reason', p_end_reason,
      'ended_by', CASE 
        WHEN session_record.user_id = p_user_id THEN 'user'
        ELSE 'specialist'
      END
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

-- Create function to get session with messages (for consistency)
CREATE OR REPLACE FUNCTION get_session_with_messages(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  messages_data JSONB;
  result JSONB;
BEGIN
  -- Get session
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Session not found');
  END IF;
  
  -- Check permissions
  IF session_record.user_id != p_user_id AND 
     NOT EXISTS (
       SELECT 1 FROM peer_specialists ps 
       WHERE ps.user_id = p_user_id AND ps.id = session_record.specialist_id
     ) THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;
  
  -- Get messages
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'content', content,
      'sender_id', sender_id,
      'sender_type', sender_type,
      'message_type', message_type,
      'metadata', metadata,
      'is_read', is_read,
      'created_at', created_at
    ) ORDER BY created_at
  ) INTO messages_data
  FROM chat_messages
  WHERE session_id = p_session_id;
  
  result := jsonb_build_object(
    'session', to_jsonb(session_record),
    'messages', COALESCE(messages_data, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Add message deduplication function
CREATE OR REPLACE FUNCTION check_message_duplicate(
  p_session_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_time_window_seconds INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chat_messages
    WHERE session_id = p_session_id
    AND sender_id = p_sender_id
    AND content = p_content
    AND created_at > (now() - (p_time_window_seconds || ' seconds')::interval)
  );
END;
$$;
