-- Create function to get admin users with email information
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamp with time zone,
  role_created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    ur.user_id,
    au.email,
    au.created_at,
    ur.created_at as role_created_at
  FROM public.user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at DESC;
$$;

-- Create function to add admin role safely
CREATE OR REPLACE FUNCTION public.add_admin_role(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can add admin roles');
  END IF;

  -- Check if target user exists
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
    auth.uid(),
    'add_admin_role',
    'admin_management',
    json_build_object('target_user_id', target_user_id)::text
  );

  RETURN json_build_object('success', true, 'message', 'Admin role added successfully');
END;
$$;

-- Create function to remove admin role safely
CREATE OR REPLACE FUNCTION public.remove_admin_role(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count integer;
  result json;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can remove admin roles');
  END IF;

  -- Prevent self-removal
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Cannot remove your own admin role');
  END IF;

  -- Check if target user has admin role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'User does not have admin role');
  END IF;

  -- Count remaining admins after removal
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin' AND user_id != target_user_id;

  -- Prevent removing the last admin
  IF admin_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cannot remove the last admin');
  END IF;

  -- Remove admin role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin';

  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, type, details)
  VALUES (
    auth.uid(),
    'remove_admin_role',
    'admin_management',
    json_build_object('target_user_id', target_user_id)::text
  );

  RETURN json_build_object('success', true, 'message', 'Admin role removed successfully');
END;
$$;

-- Create function to find user by email
CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email text)
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamp with time zone,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    au.created_at,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'admin') as is_admin
  FROM auth.users au
  WHERE au.email = user_email;
$$;

-- Create function to trigger password reset (this will be called from the edge function)
CREATE OR REPLACE FUNCTION public.request_admin_password_reset(target_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can request password resets');
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, type, details)
  VALUES (
    auth.uid(),
    'request_password_reset',
    'admin_management',
    json_build_object('target_email', target_email)::text
  );

  RETURN json_build_object('success', true, 'message', 'Password reset will be processed', 'user_id', target_user_id);
END;
$$;