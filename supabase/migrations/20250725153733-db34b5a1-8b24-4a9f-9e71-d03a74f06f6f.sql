-- Phase 1: Database Schema Setup for Phone Call Requests

-- Create phone_call_requests table
CREATE TABLE public.phone_call_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  request_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  responded_at TIMESTAMP WITH TIME ZONE,
  initiated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on phone_call_requests
ALTER TABLE public.phone_call_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_call_requests
CREATE POLICY "Users can view their own phone call requests" 
ON public.phone_call_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Specialists can view their phone call requests" 
ON public.phone_call_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = phone_call_requests.specialist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Specialists can create phone call requests" 
ON public.phone_call_requests 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = phone_call_requests.specialist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users and specialists can update phone call requests" 
ON public.phone_call_requests 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = phone_call_requests.specialist_id 
    AND user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX idx_phone_call_requests_session_id ON public.phone_call_requests(session_id);
CREATE INDEX idx_phone_call_requests_specialist_id ON public.phone_call_requests(specialist_id);
CREATE INDEX idx_phone_call_requests_user_id ON public.phone_call_requests(user_id);
CREATE INDEX idx_phone_call_requests_token ON public.phone_call_requests(request_token);
CREATE INDEX idx_phone_call_requests_status ON public.phone_call_requests(status);
CREATE INDEX idx_phone_call_requests_expires_at ON public.phone_call_requests(expires_at);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_phone_call_requests_updated_at
BEFORE UPDATE ON public.phone_call_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure phone_number column exists in peer_specialists (if not already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'peer_specialists' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.peer_specialists ADD COLUMN phone_number TEXT;
  END IF;
END $$;