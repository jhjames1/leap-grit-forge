
-- Fix RLS policies for session claiming
-- First, update the chat_sessions policy to allow verified specialists to update sessions they're claiming
DROP POLICY IF EXISTS "Specialists can update assigned sessions" ON public.chat_sessions;

-- Create a more comprehensive policy that allows specialists to claim waiting sessions
CREATE POLICY "Specialists can update sessions" ON public.chat_sessions
FOR UPDATE 
USING (
  -- Allow updates to sessions assigned to this specialist
  (EXISTS (
    SELECT 1 FROM peer_specialists 
    WHERE peer_specialists.id = chat_sessions.specialist_id 
    AND peer_specialists.user_id = auth.uid()
  ))
  OR
  -- Allow verified specialists to claim waiting sessions
  (status = 'waiting' AND specialist_id IS NULL AND EXISTS (
    SELECT 1 FROM peer_specialists 
    WHERE peer_specialists.user_id = auth.uid() 
    AND peer_specialists.is_active = true 
    AND peer_specialists.is_verified = true
  ))
);

-- Add a function to safely claim sessions with proper validation
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
  SELECT * INTO session_record
  FROM chat_sessions
  WHERE id = p_session_id
  AND status = 'waiting'
  AND specialist_id IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Session not available for claiming'
    );
  END IF;
  
  -- Claim the session
  UPDATE chat_sessions
  SET 
    specialist_id = specialist_record.id,
    status = 'active',
    updated_at = now()
  WHERE id = p_session_id
  RETURNING * INTO session_record;
  
  -- Log the claim
  INSERT INTO user_activity_logs (user_id, action, type, details)
  VALUES (
    p_specialist_user_id,
    'session_claimed',
    'chat_session',
    json_build_object('session_id', p_session_id, 'specialist_id', specialist_record.id)::text
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
