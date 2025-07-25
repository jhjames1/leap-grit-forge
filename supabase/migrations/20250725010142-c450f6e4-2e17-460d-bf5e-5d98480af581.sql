-- Complete the remaining security definer functions with proper search paths
-- This will address the remaining security linter warnings

CREATE OR REPLACE FUNCTION public.log_login_attempt(p_user_id uuid, p_ip_address inet, p_user_agent text, p_login_status text DEFAULT 'success'::text, p_location_data jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  login_id UUID;
BEGIN
  INSERT INTO public.user_login_history (
    user_id, ip_address, user_agent, login_status, location_data
  ) VALUES (
    p_user_id, p_ip_address, p_user_agent, p_login_status, p_location_data
  ) RETURNING id INTO login_id;
  
  RETURN login_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_specialist_training_summary(p_specialist_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_scenarios', (SELECT COUNT(*) FROM training_scenarios WHERE is_active = true),
    'completed_scenarios', (
      SELECT COUNT(*) 
      FROM training_progress 
      WHERE specialist_id = p_specialist_id AND status = 'completed'
    ),
    'in_progress_scenarios', (
      SELECT COUNT(*) 
      FROM training_progress 
      WHERE specialist_id = p_specialist_id AND status = 'in_progress'
    ),
    'average_score', (
      SELECT COALESCE(AVG(score), 0) 
      FROM training_progress 
      WHERE specialist_id = p_specialist_id AND status = 'completed' AND score IS NOT NULL
    ),
    'categories_progress', (
      SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
          'total', category_totals.total,
          'completed', COALESCE(category_completed.completed, 0)
        )
      )
      FROM (
        SELECT category, COUNT(*) as total 
        FROM training_scenarios 
        WHERE is_active = true 
        GROUP BY category
      ) category_totals
      LEFT JOIN (
        SELECT ts.category, COUNT(*) as completed
        FROM training_progress tp
        JOIN training_scenarios ts ON ts.id = tp.scenario_id
        WHERE tp.specialist_id = p_specialist_id AND tp.status = 'completed'
        GROUP BY ts.category
      ) category_completed ON category_totals.category = category_completed.category
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'scenario_title', ts.title,
          'status', tp.status,
          'completed_at', tp.completed_at,
          'score', tp.score
        )
      )
      FROM training_progress tp
      JOIN training_scenarios ts ON ts.id = tp.scenario_id
      WHERE tp.specialist_id = p_specialist_id
      ORDER BY tp.updated_at DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_specialist_availability(p_specialist_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  settings_record RECORD;
  day_name TEXT;
  working_hours JSONB;
BEGIN
  -- Get specialist calendar settings
  SELECT * INTO settings_record 
  FROM public.specialist_calendar_settings 
  WHERE specialist_id = p_specialist_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if within working hours
  day_name := lower(to_char(p_start_time, 'Day'));
  day_name := trim(day_name);
  
  working_hours := settings_record.working_hours -> day_name;
  
  IF working_hours IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for conflicting appointments
  IF EXISTS (
    SELECT 1 FROM public.specialist_appointments 
    WHERE specialist_id = p_specialist_id
    AND status IN ('scheduled', 'confirmed', 'in_progress')
    AND (
      (scheduled_start <= p_start_time AND scheduled_end > p_start_time) OR
      (scheduled_start < p_end_time AND scheduled_end >= p_end_time) OR
      (scheduled_start >= p_start_time AND scheduled_end <= p_end_time)
    )
  ) THEN
    RETURN false;
  END IF;
  
  -- Check for availability exceptions
  IF EXISTS (
    SELECT 1 FROM public.specialist_availability_exceptions 
    WHERE specialist_id = p_specialist_id
    AND exception_type = 'unavailable'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_working_hours_to_schedules(p_specialist_id uuid, p_working_hours jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  day_record RECORD;
  day_num INTEGER;
  start_time TIME;
  end_time TIME;
  is_enabled BOOLEAN;
BEGIN
  -- Delete existing schedules for this specialist
  DELETE FROM specialist_schedules 
  WHERE specialist_id = p_specialist_id 
  AND is_recurring = true;

  -- Loop through each day of the week
  FOR day_record IN 
    SELECT * FROM jsonb_each(p_working_hours)
  LOOP
    -- Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
    CASE day_record.key
      WHEN 'sunday' THEN day_num := 0;
      WHEN 'monday' THEN day_num := 1;
      WHEN 'tuesday' THEN day_num := 2;
      WHEN 'wednesday' THEN day_num := 3;
      WHEN 'thursday' THEN day_num := 4;
      WHEN 'friday' THEN day_num := 5;
      WHEN 'saturday' THEN day_num := 6;
      ELSE CONTINUE;
    END CASE;

    -- Extract day settings
    is_enabled := COALESCE((day_record.value->>'enabled')::BOOLEAN, false);
    
    IF is_enabled THEN
      start_time := (day_record.value->>'start')::TIME;
      end_time := (day_record.value->>'end')::TIME;
      
      -- Get the default appointment type (first active one)
      INSERT INTO specialist_schedules (
        specialist_id,
        day_of_week,
        start_time,
        end_time,
        appointment_type_id,
        is_recurring,
        is_active
      )
      SELECT 
        p_specialist_id,
        day_num,
        start_time,
        end_time,
        at.id,
        true,
        true
      FROM appointment_types at
      WHERE at.is_active = true
      ORDER BY at.created_at
      LIMIT 1;
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_specialist(specialist_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  result json;
  calling_user_id uuid;
BEGIN
  calling_user_id := auth.uid();
  
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = calling_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Admin permissions required');
  END IF;

  -- Check if specialist exists
  IF NOT EXISTS (SELECT 1 FROM public.peer_specialists WHERE id = specialist_id) THEN
    RETURN json_build_object('success', false, 'error', 'Specialist not found');
  END IF;

  -- Perform the soft delete
  UPDATE public.peer_specialists
  SET 
    is_active = false,
    is_verified = false,
    updated_at = now()
  WHERE id = specialist_id;

  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, type, details)
  VALUES (
    calling_user_id,
    'soft_delete_specialist',
    'admin_management',
    json_build_object('specialist_id', specialist_id)::text
  );

  RETURN json_build_object('success', true, 'message', 'Specialist deactivated successfully');
END;
$function$;