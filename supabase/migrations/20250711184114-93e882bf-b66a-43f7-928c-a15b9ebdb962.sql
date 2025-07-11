-- First, let's check the current RLS policies and fix them
-- Drop the existing restrictive policy and create a proper one

DROP POLICY IF EXISTS "Allow authenticated users to create specialists" ON public.peer_specialists;

-- Create a more explicit policy that ensures user_id matches auth.uid()
CREATE POLICY "Users can create their own specialist profile" 
ON public.peer_specialists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also ensure the SELECT policy is working correctly
DROP POLICY IF EXISTS "Anyone can view active specialists" ON public.peer_specialists;

CREATE POLICY "Anyone can view active specialists" 
ON public.peer_specialists 
FOR SELECT 
USING (is_active = true OR auth.uid() = user_id);

-- Ensure the UPDATE policy is correct
DROP POLICY IF EXISTS "Specialists can update their own profile" ON public.peer_specialists;

CREATE POLICY "Specialists can update their own profile" 
ON public.peer_specialists 
FOR UPDATE 
USING (auth.uid() = user_id);