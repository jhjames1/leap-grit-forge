
-- Fix the remaining RLS policy issue for user_login_history
DROP POLICY IF EXISTS "System can insert login history" ON public.user_login_history;

CREATE POLICY "Users can insert their own login history" 
ON public.user_login_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
