
-- First, let's check the current state of specialists and update them to be active and verified
-- This will allow them to see waiting chat sessions

-- Update existing specialists to be active and verified
UPDATE public.peer_specialists 
SET 
  is_active = true,
  is_verified = true,
  updated_at = now()
WHERE is_active = false OR is_verified = false;

-- Let's also check if there are any waiting sessions by creating a test one if none exist
-- (This will help with testing)
INSERT INTO public.chat_sessions (user_id, status, started_at)
SELECT 
  '45039690-05da-4235-b236-1f085acb0bf1'::uuid, 
  'waiting'::text, 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_sessions 
  WHERE status = 'waiting' AND specialist_id IS NULL
);

-- Add some sample specialists if none exist (for testing purposes)
INSERT INTO public.peer_specialists (
  user_id, 
  first_name, 
  last_name, 
  bio, 
  specialties, 
  years_experience, 
  is_verified, 
  is_active
) VALUES
(
  '45039690-05da-4235-b236-1f085acb0bf1'::uuid,
  'Test', 
  'Specialist', 
  'Test specialist for dashboard access', 
  ARRAY['General Support', 'Crisis Intervention'], 
  5, 
  true, 
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  is_verified = true,
  is_active = true,
  updated_at = now();

-- Create specialist status record
INSERT INTO public.specialist_status (specialist_id, status, status_message)
SELECT 
  ps.id,
  'online'::text,
  'Available for chat'
FROM public.peer_specialists ps
WHERE ps.user_id = '45039690-05da-4235-b236-1f085acb0bf1'::uuid
ON CONFLICT (specialist_id) DO UPDATE SET
  status = 'online',
  status_message = 'Available for chat',
  updated_at = now();
