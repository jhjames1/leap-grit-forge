-- Fix search path security for all remaining functions
-- This addresses 20 security warnings by adding proper search path protection

-- Fix generate_invitation_token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$function$;

-- Fix generate_temporary_password
CREATE OR REPLACE FUNCTION public.generate_temporary_password()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  -- Generate a secure 12-character temporary password
  RETURN upper(substring(encode(gen_random_bytes(9), 'base64') from 1 for 12));
END;
$function$;

-- Fix update_specialist_status_from_calendar
CREATE OR REPLACE FUNCTION public.update_specialist_status_from_calendar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  current_appointment RECORD;
  specialist_user_id UUID;
BEGIN
  -- Get specialist user_id
  SELECT user_id INTO specialist_user_id 
  FROM public.peer_specialists 
  WHERE id = NEW.specialist_id;
  
  -- Check if specialist has an active appointment right now
  SELECT * INTO current_appointment
  FROM public.specialist_appointments
  WHERE specialist_id = NEW.specialist_id
  AND status IN ('confirmed', 'in_progress')
  AND scheduled_start <= now()
  AND scheduled_end > now();
  
  -- Update specialist status
  IF current_appointment.id IS NOT NULL THEN
    INSERT INTO public.specialist_status (specialist_id, status, status_message)
    VALUES (NEW.specialist_id, 'busy', 'In appointment')
    ON CONFLICT (specialist_id) 
    DO UPDATE SET 
      status = 'busy',
      status_message = 'In appointment',
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix trigger_sync_working_hours
CREATE OR REPLACE FUNCTION public.trigger_sync_working_hours()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  -- Only sync if working_hours changed
  IF OLD.working_hours IS DISTINCT FROM NEW.working_hours THEN
    PERFORM sync_working_hours_to_schedules(NEW.specialist_id, NEW.working_hours);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix end_chat_session
CREATE OR REPLACE FUNCTION public.end_chat_session(p_session_id uuid, p_user_id uuid, p_specialist_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
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
$function$;

-- Fix start_chat_session_atomic
CREATE OR REPLACE FUNCTION public.start_chat_session_atomic(p_user_id uuid)
 RETURNS chat_operation_result
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
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
$function$;

-- Fix debug_auth_context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN json_build_object(
    'auth_uid', auth.uid(),
    'is_admin_result', public.is_admin(auth.uid()),
    'timestamp', now()
  );
END;
$function$;

-- Fix send_message_atomic
CREATE OR REPLACE FUNCTION public.send_message_atomic(p_session_id uuid, p_sender_id uuid, p_sender_type text, p_content text, p_message_type text DEFAULT 'text'::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS chat_operation_result
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
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
$function$;

-- Fix end_chat_session_atomic
CREATE OR REPLACE FUNCTION public.end_chat_session_atomic(p_session_id uuid, p_user_id uuid, p_end_reason text DEFAULT 'manual'::text)
 RETURNS chat_operation_result
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
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
$function$;

-- Fix get_session_with_messages
CREATE OR REPLACE FUNCTION public.get_session_with_messages(p_session_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
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
$function$;

-- Fix check_message_duplicate
CREATE OR REPLACE FUNCTION public.check_message_duplicate(p_session_id uuid, p_sender_id uuid, p_content text, p_time_window_seconds integer DEFAULT 30)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chat_messages
    WHERE session_id = p_session_id
    AND sender_id = p_sender_id
    AND content = p_content
    AND created_at > (now() - (p_time_window_seconds || ' seconds')::interval)
  );
END;
$function$;

-- Fix claim_chat_session
CREATE OR REPLACE FUNCTION public.claim_chat_session(p_session_id uuid, p_specialist_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
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
$function$;

-- Fix set_user_type
CREATE OR REPLACE FUNCTION public.set_user_type(target_user_id uuid)
 RETURNS user_type
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  determined_type public.user_type;
BEGIN
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    determined_type := 'admin';
  -- Check if user is specialist
  ELSIF EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE user_id = target_user_id
  ) THEN
    determined_type := 'specialist';
  -- Default to peer_client
  ELSE
    determined_type := 'peer_client';
  END IF;
  
  -- Update the profiles table
  UPDATE public.profiles 
  SET user_type = determined_type 
  WHERE user_id = target_user_id;
  
  RETURN determined_type;
END;
$function$;

-- Fix auto_set_user_type
CREATE OR REPLACE FUNCTION public.auto_set_user_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  NEW.user_type := public.set_user_type(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Fix update_user_type_on_role_change
CREATE OR REPLACE FUNCTION public.update_user_type_on_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  -- Update user type for the affected user
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.set_user_type(NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.set_user_type(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix trigger_specialist_status_update
CREATE OR REPLACE FUNCTION public.trigger_specialist_status_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  -- Update status for the affected specialist
  PERFORM public.update_specialist_status_from_calendar_schedule();
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

-- Fix update_specialist_last_seen
CREATE OR REPLACE FUNCTION public.update_specialist_last_seen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$function$;