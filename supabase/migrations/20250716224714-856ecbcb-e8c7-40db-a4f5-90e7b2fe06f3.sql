-- Drop existing update policy to recreate it properly
DROP POLICY IF EXISTS "Specialists can update their own profile" ON public.peer_specialists;
DROP POLICY IF EXISTS "Admins can update specialist profiles" ON public.peer_specialists;

-- Create new update policy that allows both specialists and admins
CREATE POLICY "Specialists and admins can update profiles" 
ON public.peer_specialists 
FOR UPDATE 
USING (
  -- Specialists can update their own profile
  auth.uid() = user_id 
  OR 
  -- Admins can update any specialist profile
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);