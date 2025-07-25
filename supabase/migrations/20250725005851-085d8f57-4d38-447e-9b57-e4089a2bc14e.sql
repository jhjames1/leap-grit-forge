-- Fix SQL injection vulnerability in update_specialist_status_from_calendar_schedule
DROP FUNCTION IF EXISTS public.update_specialist_status_from_calendar_schedule();

CREATE OR REPLACE FUNCTION public.update_specialist_status_from_calendar_schedule()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  specialist_record RECORD;
  current_time_ts TIMESTAMPTZ;
  day_name TEXT;
  working_hours JSONB;
  current_appointment RECORD;
  exception_record RECORD;
  upcoming_appointment RECORD;
  new_status TEXT;
  start_time TIME;
  end_time TIME;
  current_time_only TIME;
BEGIN
  current_time_ts := now();
  
  -- Loop through all active specialists
  FOR specialist_record IN 
    SELECT ps.id, ps.user_id 
    FROM public.peer_specialists ps
    WHERE ps.is_active = true AND ps.is_verified = true
  LOOP
    new_status := 'offline'; -- Default status
    
    -- Check if specialist has an active appointment right now
    SELECT * INTO current_appointment
    FROM public.specialist_appointments sa
    WHERE sa.specialist_id = specialist_record.id
    AND sa.status IN ('confirmed', 'in_progress')
    AND sa.scheduled_start <= current_time_ts
    AND sa.scheduled_end > current_time_ts;
    
    -- Check for availability exceptions (blocked times)
    SELECT * INTO exception_record
    FROM public.specialist_availability_exceptions sae
    WHERE sae.specialist_id = specialist_record.id
    AND sae.exception_type = 'unavailable'
    AND sae.start_time <= current_time_ts
    AND sae.end_time > current_time_ts;
    
    -- Check for upcoming appointment in next 15 minutes
    SELECT * INTO upcoming_appointment
    FROM public.specialist_appointments sa2
    WHERE sa2.specialist_id = specialist_record.id
    AND sa2.status IN ('scheduled', 'confirmed')
    AND sa2.scheduled_start > current_time_ts
    AND sa2.scheduled_start <= current_time_ts + interval '15 minutes';
    
    -- If has active appointment or blocked time, set to busy
    IF current_appointment.id IS NOT NULL OR exception_record.id IS NOT NULL THEN
      new_status := 'busy';
    ELSE
      -- Check if within working hours
      SELECT scs.working_hours INTO working_hours
      FROM public.specialist_calendar_settings scs
      WHERE scs.specialist_id = specialist_record.id;
      
      IF working_hours IS NOT NULL THEN
        -- Get current day name
        day_name := lower(to_char(current_time_ts, 'Day'));
        day_name := trim(day_name);
        
        -- Check if day is enabled and within hours
        IF (working_hours -> day_name ->> 'enabled')::boolean = true THEN
          start_time := (working_hours -> day_name ->> 'start')::TIME;
          end_time := (working_hours -> day_name ->> 'end')::TIME;
          current_time_only := current_time_ts::TIME;
          
          IF current_time_only >= start_time AND current_time_only <= end_time THEN
            -- Within working hours
            IF upcoming_appointment.id IS NOT NULL THEN
              new_status := 'busy'; -- Upcoming appointment soon
            ELSE
              new_status := 'online'; -- Available
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
    
    -- Update specialist status (only if not manually overridden recently)
    INSERT INTO public.specialist_status (specialist_id, status, status_message, updated_at)
    VALUES (
      specialist_record.id, 
      new_status,
      CASE 
        WHEN new_status = 'busy' AND current_appointment.id IS NOT NULL THEN 'In appointment'
        WHEN new_status = 'busy' AND upcoming_appointment.id IS NOT NULL THEN 'Appointment starting soon'
        WHEN new_status = 'busy' AND exception_record.id IS NOT NULL THEN 'Unavailable'
        WHEN new_status = 'online' THEN 'Available'
        ELSE 'Offline'
      END,
      current_time_ts
    )
    ON CONFLICT (specialist_id) 
    DO UPDATE SET 
      status = EXCLUDED.status,
      status_message = EXCLUDED.status_message,
      updated_at = EXCLUDED.updated_at
    -- Only update if not manually set in the last 30 minutes
    WHERE specialist_status.updated_at < current_time_ts - interval '30 minutes'
       OR specialist_status.status != EXCLUDED.status;
    
  END LOOP;
END;
$function$;

-- Update all other security definer functions to include proper search path
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$function$;

-- Fix admin role validation to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.add_admin_role(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  result json;
  calling_user_id uuid;
BEGIN
  -- Get the calling user ID securely
  calling_user_id := auth.uid();
  
  -- Validate calling user exists and is authenticated
  IF calling_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Check if the calling user is an admin using direct query to avoid recursion
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = calling_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can add admin roles');
  END IF;

  -- Validate target user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if user already has admin role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'User already has admin role');
  END IF;

  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin');

  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, type, details)
  VALUES (
    calling_user_id,
    'add_admin_role',
    'admin_management',
    json_build_object('target_user_id', target_user_id)::text
  );

  RETURN json_build_object('success', true, 'message', 'Admin role added successfully');
END;
$function$;