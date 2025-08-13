-- Change appointment proposal expiration from 7 days to 5 minutes
ALTER TABLE public.appointment_proposals 
ALTER COLUMN expires_at SET DEFAULT (now() + '5 minutes'::interval);