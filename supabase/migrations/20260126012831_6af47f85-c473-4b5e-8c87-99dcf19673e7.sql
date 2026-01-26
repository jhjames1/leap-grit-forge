
-- Fix Function Search Path Issues
-- Update functions that are missing SET search_path

-- Fix update_content_usage_count
CREATE OR REPLACE FUNCTION public.update_content_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.foreman_content 
  SET usage_count = usage_count + 1
  WHERE id = NEW.content_id;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_specialist_appointment_changes
CREATE OR REPLACE FUNCTION public.sync_specialist_appointment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE scheduled_appointments 
    SET 
      scheduled_start = NEW.scheduled_start,
      scheduled_end = NEW.scheduled_end,
      status = CASE 
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'completed' THEN 'completed'
        WHEN NEW.status = 'confirmed' THEN 'confirmed'
        WHEN NEW.status = 'scheduled' THEN 'scheduled'
        ELSE scheduled_appointments.status
      END,
      updated_at = now()
    WHERE id = NEW.scheduled_appointment_id;
    
    INSERT INTO user_activity_logs (user_id, action, type, details)
    VALUES (
      NEW.user_id,
      'appointment_synchronized',
      'calendar_sync',
      json_build_object(
        'specialist_appointment_id', NEW.id,
        'scheduled_appointment_id', NEW.scheduled_appointment_id,
        'old_start', OLD.scheduled_start,
        'new_start', NEW.scheduled_start,
        'old_end', OLD.scheduled_end,
        'new_end', NEW.scheduled_end
      )::text
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix permanently_delete_specialist (single arg version)
CREATE OR REPLACE FUNCTION public.permanently_delete_specialist(specialist_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result json;
  specialist_user_id uuid;
  specialist_email text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Admin permissions required');
  END IF;

  SELECT user_id INTO specialist_user_id
  FROM public.peer_specialists 
  WHERE id = specialist_id AND is_active = false;

  IF specialist_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Specialist not found or not soft deleted');
  END IF;

  SELECT email INTO specialist_email
  FROM auth.users
  WHERE id = specialist_user_id;

  DELETE FROM public.specialist_content_views 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  DELETE FROM public.specialist_schedules 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  DELETE FROM public.specialist_status 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  UPDATE public.chat_sessions 
  SET specialist_id = NULL, 
      status = 'ended',
      ended_at = COALESCE(ended_at, now())
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  DELETE FROM public.peer_specialists 
  WHERE id = permanently_delete_specialist.specialist_id;

  INSERT INTO public.user_activity_logs (user_id, action, type, details)
  VALUES (
    auth.uid(),
    'permanently_delete_specialist',
    'admin_management',
    json_build_object(
      'specialist_id', specialist_id,
      'specialist_user_id', specialist_user_id,
      'specialist_email', specialist_email
    )::text
  );

  RETURN json_build_object(
    'success', true, 
    'message', 'Specialist permanently deleted successfully',
    'specialist_id', specialist_id
  );
END;
$function$;

-- Fix permanently_delete_specialist (two arg version)
CREATE OR REPLACE FUNCTION public.permanently_delete_specialist(specialist_id uuid, admin_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result json;
  specialist_user_id uuid;
  specialist_email text;
BEGIN
  IF NOT public.is_admin(admin_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Admin permissions required');
  END IF;

  SELECT user_id INTO specialist_user_id
  FROM public.peer_specialists 
  WHERE id = specialist_id AND is_active = false;

  IF specialist_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Specialist not found or not soft deleted');
  END IF;

  SELECT email INTO specialist_email
  FROM auth.users
  WHERE id = specialist_user_id;

  DELETE FROM public.specialist_content_views 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  DELETE FROM public.specialist_schedules 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  DELETE FROM public.specialist_status 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  UPDATE public.chat_sessions 
  SET specialist_id = NULL, 
      status = 'ended',
      ended_at = COALESCE(ended_at, now())
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  DELETE FROM public.peer_specialists 
  WHERE id = permanently_delete_specialist.specialist_id;

  INSERT INTO public.user_activity_logs (user_id, action, type, details)
  VALUES (
    admin_user_id,
    'permanently_delete_specialist',
    'admin_management',
    json_build_object(
      'specialist_id', specialist_id,
      'specialist_user_id', specialist_user_id,
      'specialist_email', specialist_email
    )::text
  );

  RETURN json_build_object(
    'success', true, 
    'message', 'Specialist permanently deleted successfully',
    'specialist_id', specialist_id
  );
END;
$function$;

-- Fix RLS Policies with USING(true) or WITH CHECK(true) for INSERT/UPDATE/DELETE
-- These are the problematic policies identified by the linter

-- Fix manual_change_tracking INSERT policy
DROP POLICY IF EXISTS "System can create change tracking records" ON public.manual_change_tracking;
CREATE POLICY "Admins can create change tracking records" 
ON public.manual_change_tracking
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Fix notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can receive notifications for themselves" 
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix password_reset_codes policy (only service role should manage)
DROP POLICY IF EXISTS "Service role can manage reset codes" ON public.password_reset_codes;
-- This table should only be accessed by edge functions with service role, not via client
-- We'll create a restrictive policy that blocks client access
CREATE POLICY "No direct client access to reset codes" 
ON public.password_reset_codes
FOR ALL
TO authenticated
USING (false);

-- Fix peer_monthly_metrics ALL policy
DROP POLICY IF EXISTS "System can manage monthly metrics" ON public.peer_monthly_metrics;
CREATE POLICY "Admins can manage monthly metrics" 
ON public.peer_monthly_metrics
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Fix peer_performance_events INSERT policy
DROP POLICY IF EXISTS "System can insert performance events" ON public.peer_performance_events;
CREATE POLICY "Authenticated users can log performance events" 
ON public.peer_performance_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM peer_specialists ps 
    WHERE ps.id = peer_performance_events.peer_id 
    AND ps.user_id = auth.uid()
  )
);

-- Fix scheduled_appointments INSERT policy
DROP POLICY IF EXISTS "System can create scheduled appointments" ON public.scheduled_appointments;
CREATE POLICY "Specialists can create scheduled appointments" 
ON public.scheduled_appointments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM peer_specialists ps 
    WHERE ps.id = specialist_id 
    AND ps.user_id = auth.uid()
  )
);

-- Fix specialist_availability_exceptions SELECT policy
DROP POLICY IF EXISTS "Anyone can view availability exceptions" ON public.specialist_availability_exceptions;
CREATE POLICY "Authenticated users can view availability exceptions" 
ON public.specialist_availability_exceptions
FOR SELECT
TO authenticated
USING (true);

-- Fix specialist_calendar_settings SELECT policy  
DROP POLICY IF EXISTS "Anyone can view calendar settings" ON public.specialist_calendar_settings;
CREATE POLICY "Authenticated users can view calendar settings" 
ON public.specialist_calendar_settings
FOR SELECT
TO authenticated
USING (true);

-- The thought_items and thought_packs policies need SELECT-only true, which is acceptable
-- for public read access, so we leave those as-is
