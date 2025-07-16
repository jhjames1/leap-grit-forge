-- Fix RLS policy to use security definer function to avoid auth context issues
DROP POLICY IF EXISTS "Specialists and admins can update profiles" ON public.peer_specialists;

-- Create new update policy using the existing is_admin security definer function
CREATE POLICY "Specialists and admins can update profiles" 
ON public.peer_specialists 
FOR UPDATE 
USING (
  -- Specialists can update their own profile
  auth.uid() = user_id 
  OR 
  -- Admins can update any specialist profile (using security definer function)
  public.is_admin(auth.uid())
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  auth.uid() = user_id 
  OR 
  public.is_admin(auth.uid())
);