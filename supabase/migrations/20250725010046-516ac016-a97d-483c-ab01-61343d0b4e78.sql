-- Fix all remaining security definer functions to include proper search paths
-- This addresses the security linter warnings about mutable search paths

CREATE OR REPLACE FUNCTION public.remove_admin_role(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  admin_count integer;
  result json;
  calling_user_id uuid;
BEGIN
  calling_user_id := auth.uid();
  
  -- Validate authentication
  IF calling_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = calling_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can remove admin roles');
  END IF;

  -- Prevent self-removal
  IF target_user_id = calling_user_id THEN
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
    calling_user_id,
    'remove_admin_role',
    'admin_management',
    json_build_object('target_user_id', target_user_id)::text
  );

  RETURN json_build_object('success', true, 'message', 'Admin role removed successfully');
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email text)
 RETURNS TABLE(user_id uuid, email text, created_at timestamp with time zone, is_admin boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT 
    au.id as user_id,
    au.email,
    au.created_at,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'admin') as is_admin
  FROM auth.users au
  WHERE au.email = user_email;
$function$;

CREATE OR REPLACE FUNCTION public.request_admin_password_reset(target_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  target_user_id uuid;
  calling_user_id uuid;
BEGIN
  calling_user_id := auth.uid();
  
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = calling_user_id AND role = 'admin'
  ) THEN
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
    calling_user_id,
    'request_password_reset',
    'admin_management',
    json_build_object('target_email', target_email)::text
  );

  RETURN json_build_object('success', true, 'message', 'Password reset will be processed', 'user_id', target_user_id);
END;
$function$;

-- Fix all other critical functions with search path
CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, email text, created_at timestamp with time zone, role_created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT 
    ur.user_id,
    au.email,
    au.created_at,
    ur.created_at as role_created_at
  FROM public.user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_users_for_admin()
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$;