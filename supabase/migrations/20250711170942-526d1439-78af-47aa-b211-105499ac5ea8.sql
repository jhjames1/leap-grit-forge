-- Create peer specialists table
CREATE TABLE public.peer_specialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[],
  years_experience INTEGER DEFAULT 0,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create specialist status table for real-time availability
CREATE TABLE public.specialist_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'away', 'offline', 'busy')) DEFAULT 'offline',
  status_message TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(specialist_id)
);

-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES public.peer_specialists(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'ended')) DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'specialist')) DEFAULT 'user',
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'quick_action', 'system')) DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create specialist schedules table
CREATE TABLE public.specialist_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, day_of_week)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.peer_specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for peer_specialists
CREATE POLICY "Anyone can view active specialists" 
ON public.peer_specialists 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Specialists can update their own profile" 
ON public.peer_specialists 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for specialist_status
CREATE POLICY "Anyone can view specialist status" 
ON public.specialist_status 
FOR SELECT 
USING (true);

CREATE POLICY "Specialists can update their own status" 
ON public.specialist_status 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_id AND user_id = auth.uid()
  )
);

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Specialists can update assigned sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_id AND user_id = auth.uid()
  )
);

-- RLS Policies for chat_messages
CREATE POLICY "Session participants can view messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = session_id AND (
      cs.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.peer_specialists ps
        WHERE ps.id = cs.specialist_id AND ps.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Session participants can insert messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = session_id AND (
      cs.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.peer_specialists ps
        WHERE ps.id = cs.specialist_id AND ps.user_id = auth.uid()
      )
    )
  )
);

-- RLS Policies for specialist_schedules
CREATE POLICY "Anyone can view specialist schedules" 
ON public.specialist_schedules 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Specialists can manage their own schedules" 
ON public.specialist_schedules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_id AND user_id = auth.uid()
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_peer_specialists_updated_at
BEFORE UPDATE ON public.peer_specialists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialist_status_updated_at
BEFORE UPDATE ON public.specialist_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialist_schedules_updated_at
BEFORE UPDATE ON public.specialist_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update specialist last_seen when status changes
CREATE OR REPLACE FUNCTION public.update_specialist_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_specialist_last_seen_trigger
BEFORE UPDATE ON public.specialist_status
FOR EACH ROW
EXECUTE FUNCTION public.update_specialist_last_seen();