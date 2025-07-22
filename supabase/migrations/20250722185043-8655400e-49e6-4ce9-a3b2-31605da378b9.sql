-- This migration ensures that specialists with temporary passwords 
-- have the must_change_password flag set properly

-- Update specialists who need to change their password
-- Check for new specialists with must_change_password is NULL
UPDATE public.peer_specialists 
SET must_change_password = true,
    updated_at = now()
WHERE must_change_password IS NULL
  AND created_at > (now() - interval '7 days')
  AND is_verified = true;

-- Add the must_change_password column if it doesn't exist yet
-- (This is a safety check, should already exist from previous migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'peer_specialists' 
      AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE public.peer_specialists
    ADD COLUMN must_change_password BOOLEAN DEFAULT false;
  END IF;
END $$;