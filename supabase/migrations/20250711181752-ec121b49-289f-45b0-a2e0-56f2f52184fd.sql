-- Update the function to return all users with email addresses (remove domain restriction)
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
$$;