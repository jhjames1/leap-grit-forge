-- Create admin user using Supabase's auth functions
-- We'll use a simpler approach that works with the existing schema

-- First, let's check if the user already exists and create them if not
DO $$
DECLARE
  admin_user_id uuid;
  user_exists boolean := false;
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'jjames@modecommunications.net';
  
  IF admin_user_id IS NOT NULL THEN
    user_exists := true;
  ELSE
    -- Create the user directly in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
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
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
  END IF;
  
  -- Add admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin user created/updated: % with ID: %', 'jjames@modecommunications.net', admin_user_id;
  END IF;
END $$;