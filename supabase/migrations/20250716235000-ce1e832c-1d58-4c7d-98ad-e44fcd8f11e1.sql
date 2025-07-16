-- Update function to accept admin_user_id parameter for proper permission checking
CREATE OR REPLACE FUNCTION public.permanently_delete_specialist(specialist_id uuid, admin_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
  specialist_user_id uuid;
  specialist_email text;
BEGIN
  -- Check if the calling user is an admin using the passed user_id
  IF NOT public.is_admin(admin_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Admin permissions required');
  END IF;

  -- Check if specialist exists and is already soft deleted
  SELECT user_id INTO specialist_user_id
  FROM public.peer_specialists 
  WHERE id = specialist_id AND is_active = false;

  IF specialist_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Specialist not found or not soft deleted');
  END IF;

  -- Get specialist email for logging
  SELECT email INTO specialist_email
  FROM auth.users
  WHERE id = specialist_user_id;

  -- Delete related data in proper order to handle foreign key constraints
  
  -- Delete specialist content views
  DELETE FROM public.specialist_content_views 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  -- Delete specialist schedules
  DELETE FROM public.specialist_schedules 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  -- Delete specialist status
  DELETE FROM public.specialist_status 
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  -- Update chat sessions to remove specialist reference (preserve chat history)
  UPDATE public.chat_sessions 
  SET specialist_id = NULL, 
      status = 'ended',
      ended_at = COALESCE(ended_at, now())
  WHERE specialist_id = permanently_delete_specialist.specialist_id;

  -- Delete the specialist profile
  DELETE FROM public.peer_specialists 
  WHERE id = permanently_delete_specialist.specialist_id;

  -- Log the permanent deletion action
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