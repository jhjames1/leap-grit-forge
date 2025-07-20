-- Add email field to peer_specialists table to store the login email
ALTER TABLE public.peer_specialists 
ADD COLUMN email TEXT;

-- Add index for email lookups
CREATE INDEX idx_peer_specialists_email ON public.peer_specialists(email);