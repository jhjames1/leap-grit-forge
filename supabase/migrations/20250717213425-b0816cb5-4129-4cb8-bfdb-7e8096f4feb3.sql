-- Create appointment proposals table
CREATE TABLE public.appointment_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appointment_type_id UUID NOT NULL REFERENCES public.appointment_types(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  occurrences INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  chat_session_id UUID REFERENCES public.chat_sessions(id),
  proposed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointment_proposals ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment proposals
CREATE POLICY "Users can view their own appointment proposals" 
ON public.appointment_proposals 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = appointment_proposals.specialist_id AND user_id = auth.uid()
));

CREATE POLICY "Specialists can create appointment proposals" 
ON public.appointment_proposals 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = appointment_proposals.specialist_id AND user_id = auth.uid()
));

CREATE POLICY "Users and specialists can update proposals" 
ON public.appointment_proposals 
FOR UPDATE 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = appointment_proposals.specialist_id AND user_id = auth.uid()
));

-- Create scheduled appointments table for recurring appointments
CREATE TABLE public.scheduled_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.appointment_proposals(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appointment_type_id UUID NOT NULL REFERENCES public.appointment_types(id),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  meeting_type TEXT NOT NULL DEFAULT 'chat',
  meeting_url TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled appointments
CREATE POLICY "Users can view their own scheduled appointments" 
ON public.scheduled_appointments 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = scheduled_appointments.specialist_id AND user_id = auth.uid()
));

CREATE POLICY "System can create scheduled appointments" 
ON public.scheduled_appointments 
FOR INSERT 
WITH CHECK (true); -- Will be created by edge function

CREATE POLICY "Users and specialists can update scheduled appointments" 
ON public.scheduled_appointments 
FOR UPDATE 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE id = scheduled_appointments.specialist_id AND user_id = auth.uid()
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_appointment_proposals_updated_at
BEFORE UPDATE ON public.appointment_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_appointments_updated_at
BEFORE UPDATE ON public.scheduled_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();