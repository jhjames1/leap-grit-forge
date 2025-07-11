-- Grant admin role to the existing users so they can manage specialists
INSERT INTO public.user_roles (user_id, role) 
VALUES 
  ('45039690-05da-4235-b236-1f085acb0bf1', 'admin'::app_role),
  ('99b716d6-181d-4e74-9a70-2e1aefacd3da', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update the peer_specialists RLS policy to be more permissive for admins
-- First drop the existing policy
DROP POLICY IF EXISTS "Users and admins can create specialist profiles" ON public.peer_specialists;

-- Create a new policy that properly handles admin role checking
CREATE POLICY "Users and admins can create specialist profiles" 
ON public.peer_specialists 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);