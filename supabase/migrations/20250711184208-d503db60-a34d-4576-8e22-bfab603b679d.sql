-- First, create a function to check if the current user is an admin
-- We'll need to create a user_roles table and admin role system

-- Create the app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security definer function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Update the peer_specialists INSERT policy to allow admins to create specialists for any user
DROP POLICY IF EXISTS "Users can create their own specialist profile" ON public.peer_specialists;

CREATE POLICY "Users and admins can create specialist profiles" 
ON public.peer_specialists 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR public.is_admin()
);

-- Grant the current user admin role (temporary for testing)
-- Replace with your actual admin user ID
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.uid(), 'admin'::app_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;