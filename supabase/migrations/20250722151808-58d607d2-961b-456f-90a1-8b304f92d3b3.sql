-- Create user login history table to track login attempts and IPs
CREATE TABLE public.user_login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  login_status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'banned'
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user login history
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user login history
CREATE POLICY "Admins can view all login history" 
ON public.user_login_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert login history" 
ON public.user_login_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX idx_user_login_history_ip ON public.user_login_history(ip_address);
CREATE INDEX idx_user_login_history_created_at ON public.user_login_history(created_at DESC);

-- Create function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT,
  p_login_status TEXT DEFAULT 'success',
  p_location_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  login_id UUID;
BEGIN
  INSERT INTO public.user_login_history (
    user_id, ip_address, user_agent, login_status, location_data
  ) VALUES (
    p_user_id, p_ip_address, p_user_agent, p_login_status, p_location_data
  ) RETURNING id INTO login_id;
  
  RETURN login_id;
END;
$function$;