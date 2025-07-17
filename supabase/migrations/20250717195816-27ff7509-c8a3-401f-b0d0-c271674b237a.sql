-- Update all peer specialist accounts to verified status
UPDATE public.peer_specialists 
SET is_verified = true, 
    is_active = true,
    updated_at = now()
WHERE is_verified = false OR is_active = false;

-- Also ensure they don't need to change password if they're already verified
UPDATE public.peer_specialists 
SET must_change_password = false,
    updated_at = now()
WHERE is_verified = true;