-- Add fields for admin-controlled peer specialist invitations
ALTER TABLE public.peer_specialists 
ADD COLUMN invitation_token TEXT,
ADD COLUMN invitation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN invitation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_invitation_accepted BOOLEAN DEFAULT false,
ADD COLUMN temporary_password_hash TEXT,
ADD COLUMN must_change_password BOOLEAN DEFAULT true,
ADD COLUMN invited_by_admin_id UUID,
ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;

-- Create index for invitation token lookups
CREATE INDEX idx_peer_specialists_invitation_token ON public.peer_specialists(invitation_token);

-- Add function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Add function to generate temporary passwords
CREATE OR REPLACE FUNCTION generate_temporary_password()
RETURNS TEXT AS $$
BEGIN
  -- Generate a secure 12-character temporary password
  RETURN upper(substring(encode(gen_random_bytes(9), 'base64') from 1 for 12));
END;
$$ LANGUAGE plpgsql;