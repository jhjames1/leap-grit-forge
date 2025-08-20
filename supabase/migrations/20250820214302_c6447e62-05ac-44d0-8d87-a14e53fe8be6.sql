-- Update appointment proposals expiration time from 7 days to 5 minutes
ALTER TABLE public.appointment_proposals 
ALTER COLUMN expires_at SET DEFAULT (now() + '00:05:00'::interval);