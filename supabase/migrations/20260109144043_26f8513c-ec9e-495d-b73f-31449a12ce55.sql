
-- Add admin role to jonathan@smfconsultants.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('87f0df99-f8e4-4c66-9e15-37b6a70e02a8', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
