-- Create a security definer function specifically for soft deleting specialists
CREATE OR REPLACE FUNCTION public.soft_delete_specialist(specialist_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
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
    auth.uid(),
    'soft_delete_specialist',
    'admin_management',
    json_build_object('specialist_id', specialist_id)::text
  );

  RETURN json_build_object('success', true, 'message', 'Specialist deactivated successfully');
END;
$$;