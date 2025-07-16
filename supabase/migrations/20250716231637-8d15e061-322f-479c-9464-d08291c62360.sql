-- Update the SELECT policy to allow admins to view all specialists (active and inactive)
DROP POLICY IF EXISTS "Anyone can view active specialists" ON public.peer_specialists;

CREATE POLICY "Active specialists and admin access" 
ON public.peer_specialists 
FOR SELECT 
USING (
  -- Regular users and specialists can view active specialists
  (is_active = true) 
  OR 
  -- Users can view their own specialist profile regardless of status
  (auth.uid() = user_id) 
  OR 
  -- Admins can view all specialists (active and inactive)
  public.is_admin(auth.uid())
);