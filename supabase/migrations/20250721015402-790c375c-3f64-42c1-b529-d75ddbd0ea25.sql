
-- Add admin access to profiles table
-- This allows admins to view all profiles while maintaining security for regular users
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
