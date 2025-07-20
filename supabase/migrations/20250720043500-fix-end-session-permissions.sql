
-- Fix the end_chat_session function to properly handle specialist permissions
CREATE OR REPLACE FUNCTION end_chat_session(
  p_session_id UUID,
  p_user_id UUID,
  p_specialist_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  result JSON;
BEGIN
  -- Check if the user has permission to end this session
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE id = p_session_id
  AND (user_id = p_user_id OR specialist_id = p_specialist_id);
  
  IF NOT FOUND THEN
    -- Check if user is a specialist and can claim unassigned sessions
    SELECT cs.* INTO session_record
    FROM chat_sessions cs
    WHERE cs.id = p_session_id
    AND cs.user_id = p_user_id
    AND cs.specialist_id IS NULL;
    
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Session not found or access denied'
      );
    END IF;
  END IF;
  
  -- Update the session to ended status
  UPDATE chat_sessions
  SET 
    specialist_id = p_specialist_id,
    status = 'ended',
    ended_at = now(),
    updated_at = now()
  WHERE id = p_session_id;
  
  -- Cancel any pending appointment proposals
  UPDATE appointment_proposals
  SET 
    status = 'expired',
    responded_at = now()
  WHERE chat_session_id = p_session_id
  AND status = 'pending';
  
  -- Add a final system message (use 'specialist' as sender_type)
  INSERT INTO chat_messages (
    session_id,
    sender_id,
    sender_type,
    message_type,
    content
  ) VALUES (
    p_session_id,
    p_user_id,
    'specialist',
    'text',
    'This chat session has been ended by the specialist. Thank you for using our service.'
  );
  
  -- Log the activity
  INSERT INTO user_activity_logs (
    user_id,
    action,
    type,
    details
  ) VALUES (
    p_user_id,
    'session_ended',
    'chat_session',
    json_build_object(
      'session_id', p_session_id,
      'specialist_id', p_specialist_id,
      'ended_by', 'specialist'
    )::text
  );
  
  -- Return success with updated session data
  SELECT json_build_object(
    'success', true,
    'session', row_to_json(cs.*)
  ) INTO result
  FROM chat_sessions cs
  WHERE cs.id = p_session_id;
  
  RETURN result;
END;
$$;
