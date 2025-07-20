
-- Phase 1: Data Cleanup - Fix inconsistent session states
-- First, let's identify sessions that have specialist_id but are still in waiting status
SELECT id, user_id, specialist_id, status, started_at, updated_at 
FROM chat_sessions 
WHERE specialist_id IS NOT NULL AND status = 'waiting';

-- Fix these inconsistent sessions by setting them to active status
UPDATE chat_sessions 
SET status = 'active', updated_at = now()
WHERE specialist_id IS NOT NULL AND status = 'waiting';

-- Add a constraint to prevent future inconsistencies
-- Sessions with specialist_id should not be in waiting status
ALTER TABLE chat_sessions 
ADD CONSTRAINT check_specialist_status 
CHECK (
  (specialist_id IS NULL AND status = 'waiting') OR 
  (specialist_id IS NOT NULL AND status IN ('active', 'ended'))
);

-- Update the claim_chat_session function to handle edge cases better
CREATE OR REPLACE FUNCTION public.claim_chat_session(
  p_session_id uuid,
  p_specialist_user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  specialist_record RECORD;
  session_record RECORD;
  result json;
BEGIN
  -- Get and validate specialist
  SELECT * INTO specialist_record
  FROM peer_specialists
  WHERE user_id = p_specialist_user_id
  AND is_active = true
  AND is_verified = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Specialist not found or not verified'
    );
  END IF;
  
  -- Get session with lock to prevent concurrent claims
  -- Also handle sessions that might be in inconsistent state
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE id = p_session_id
  AND (
    (status = 'waiting' AND specialist_id IS NULL) OR
    (status = 'waiting' AND specialist_id = specialist_record.id)
  )
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Check if session exists but is already claimed by another specialist
    SELECT * INTO session_record
    FROM chat_sessions
    WHERE id = p_session_id;
    
    IF session_record.id IS NOT NULL THEN
      IF session_record.status = 'active' THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Session is already active with another specialist'
        );
      ELSIF session_record.status = 'ended' THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Session has already ended'
        );
      ELSE
        RETURN json_build_object(
          'success', false,
          'error', 'Session is not available for claiming'
        );
      END IF;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Session not found'
      );
    END IF;
  END IF;
  
  -- Claim the session (or confirm existing claim)
  UPDATE chat_sessions
  SET 
    specialist_id = specialist_record.id,
    status = 'active',
    updated_at = now()
  WHERE id = p_session_id
  RETURNING * INTO session_record;
  
  -- Log the claim (only if not already logged recently)
  INSERT INTO user_activity_logs (user_id, action, type, details)
  SELECT 
    p_specialist_user_id,
    'session_claimed',
    'chat_session',
    json_build_object('session_id', p_session_id, 'specialist_id', specialist_record.id)::text
  WHERE NOT EXISTS (
    SELECT 1 FROM user_activity_logs 
    WHERE user_id = p_specialist_user_id 
    AND action = 'session_claimed'
    AND details LIKE '%' || p_session_id || '%'
    AND created_at > now() - interval '1 minute'
  );
  
  RETURN json_build_object(
    'success', true,
    'session', row_to_json(session_record)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
