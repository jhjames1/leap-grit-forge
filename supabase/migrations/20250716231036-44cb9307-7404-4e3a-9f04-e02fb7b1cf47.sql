-- Restore the original comprehensive RLS policy that allows both specialists and admins
DROP POLICY IF EXISTS "Admins can update all specialist profiles" ON public.peer_specialists;

-- Create a comprehensive policy that allows both self-updates and admin updates
CREATE POLICY "Specialists and admins can update profiles" 
ON public.peer_specialists 
FOR UPDATE 
USING (
  -- Specialists can update their own profile
  auth.uid() = user_id 
  OR 
  -- Admins can update any specialist profile
  public.is_admin(auth.uid())
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  auth.uid() = user_id 
  OR 
  public.is_admin(auth.uid())
);

-- Test the authentication context by creating a simple test function
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'auth_uid', auth.uid(),
    'is_admin_result', public.is_admin(auth.uid()),
    'timestamp', now()
  );
END;
$$;