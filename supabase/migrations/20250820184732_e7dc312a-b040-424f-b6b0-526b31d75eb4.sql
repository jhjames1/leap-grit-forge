-- Create table for temporary password reset codes
CREATE TABLE public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for the edge function to manage codes
CREATE POLICY "Service role can manage reset codes" 
ON public.password_reset_codes 
FOR ALL 
USING (true);

-- Create index for efficient lookups
CREATE INDEX idx_password_reset_codes_email_code ON public.password_reset_codes(email, code);
CREATE INDEX idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);