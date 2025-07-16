-- Fix the UPDATE policy to include WITH CHECK clause
DROP POLICY IF EXISTS "Specialists and admins can update profiles" ON public.peer_specialists;

-- Create new update policy with both USING and WITH CHECK
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
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);