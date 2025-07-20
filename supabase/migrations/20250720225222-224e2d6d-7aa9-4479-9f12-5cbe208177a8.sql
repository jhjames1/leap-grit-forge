
-- Add fields to track activation method and manual activation details
ALTER TABLE public.peer_specialists 
ADD COLUMN activation_method TEXT DEFAULT 'email',
ADD COLUMN manually_activated_by UUID REFERENCES auth.users(id);

-- Update existing activated specialists to have 'email' activation method
UPDATE public.peer_specialists 
SET activation_method = 'email' 
WHERE activated_at IS NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_peer_specialists_activation_method ON public.peer_specialists(activation_method);
CREATE INDEX idx_peer_specialists_manually_activated_by ON public.peer_specialists(manually_activated_by);
