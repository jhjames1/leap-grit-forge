-- Debug the RLS issue by temporarily enabling more permissive policy for admins
DROP POLICY IF EXISTS "Specialists and admins can update profiles" ON public.peer_specialists;

-- Create a simpler admin-only update policy for debugging
CREATE POLICY "Admins can update all specialist profiles" 
ON public.peer_specialists 
FOR UPDATE 
USING (
  public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Also ensure the is_admin function works correctly by testing it
-- (This is just for verification - the result will help us debug)