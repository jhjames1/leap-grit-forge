-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('admin', 'specialist', 'peer_client');

-- Add user_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_type public.user_type DEFAULT 'peer_client';

-- Create function to determine and set user type
CREATE OR REPLACE FUNCTION public.set_user_type(target_user_id uuid)
RETURNS public.user_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Populate existing users with correct user types
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT user_id FROM public.profiles 
  LOOP
    PERFORM public.set_user_type(profile_record.user_id);
  END LOOP;
END;
$$;

-- Create trigger function to automatically set user type for new profiles
CREATE OR REPLACE FUNCTION public.auto_set_user_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.user_type := public.set_user_type(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set user type on profile creation
CREATE TRIGGER auto_set_user_type_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_user_type();

-- Create trigger to update user type when roles change
CREATE OR REPLACE FUNCTION public.update_user_type_on_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user type for the affected user
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.set_user_type(NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.set_user_type(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for role changes
CREATE TRIGGER update_user_type_on_user_roles_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_type_on_role_change();

CREATE TRIGGER update_user_type_on_specialist_change
  AFTER INSERT OR UPDATE OR DELETE ON public.peer_specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_type_on_role_change();