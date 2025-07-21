
-- Add created_by field to track which admin created each specialist
ALTER TABLE public.peer_specialists 
ADD COLUMN created_by_admin_id uuid REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX idx_peer_specialists_created_by ON public.peer_specialists(created_by_admin_id);

-- Update existing records to set created_by_admin_id to the invited_by_admin_id where available
UPDATE public.peer_specialists 
SET created_by_admin_id = invited_by_admin_id 
WHERE invited_by_admin_id IS NOT NULL;
