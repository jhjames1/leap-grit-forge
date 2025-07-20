-- Create admin user and assign admin role
-- First, we'll create the user in the auth.users table
-- Note: In production, you should use Supabase's signup API, but for admin setup we'll do it directly

-- Insert the user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'jjames@modecommunications.net',
  crypt('mimi7202!', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID for the email we just created
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'jjames@modecommunications.net';
  
  -- Add admin role if user exists
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;