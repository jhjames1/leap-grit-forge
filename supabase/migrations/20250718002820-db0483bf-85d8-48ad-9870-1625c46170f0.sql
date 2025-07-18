-- Create tables for peer specialist performance tracking

-- Events tracking table
CREATE TABLE public.peer_performance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  peer_id UUID REFERENCES public.peer_specialists(id),
  session_id UUID REFERENCES public.chat_sessions(id),
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monthly metrics aggregation table
CREATE TABLE public.peer_monthly_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peer_id UUID NOT NULL REFERENCES public.peer_specialists(id),
  month DATE NOT NULL,
  chat_completion_rate NUMERIC(5,2),
  checkin_completion_rate NUMERIC(5,2),
  avg_user_rating NUMERIC(3,2),
  avg_streak_impact NUMERIC(5,2),
  avg_response_time_seconds NUMERIC(8,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(peer_id, month)
);

-- User session ratings table
CREATE TABLE public.peer_session_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peer_id UUID NOT NULL REFERENCES public.peer_specialists(id),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id),
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Check-ins tracking table  
CREATE TABLE public.peer_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peer_id UUID NOT NULL REFERENCES public.peer_specialists(id),
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peer_performance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_session_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for peer_performance_events
CREATE POLICY "Admins can view all performance events"
ON public.peer_performance_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert performance events"
ON public.peer_performance_events FOR INSERT
WITH CHECK (true);

-- RLS Policies for peer_monthly_metrics  
CREATE POLICY "Admins can view all monthly metrics"
ON public.peer_monthly_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can manage monthly metrics"
ON public.peer_monthly_metrics FOR ALL
USING (true);

-- RLS Policies for peer_session_ratings
CREATE POLICY "Admins can view all session ratings"
ON public.peer_session_ratings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can rate their own sessions"
ON public.peer_session_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for peer_checkins
CREATE POLICY "Admins and specialists can view checkins"
ON public.peer_checkins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = peer_checkins.peer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Specialists can manage their checkins"
ON public.peer_checkins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = peer_checkins.peer_id AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_peer_performance_events_peer_id ON public.peer_performance_events(peer_id);
CREATE INDEX idx_peer_performance_events_timestamp ON public.peer_performance_events(timestamp);
CREATE INDEX idx_peer_performance_events_type ON public.peer_performance_events(event_type);
CREATE INDEX idx_peer_monthly_metrics_peer_month ON public.peer_monthly_metrics(peer_id, month);
CREATE INDEX idx_peer_session_ratings_peer_id ON public.peer_session_ratings(peer_id);
CREATE INDEX idx_peer_checkins_peer_id ON public.peer_checkins(peer_id);

-- Add update trigger for peer_monthly_metrics
CREATE TRIGGER update_peer_monthly_metrics_updated_at
BEFORE UPDATE ON public.peer_monthly_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for peer_checkins
CREATE TRIGGER update_peer_checkins_updated_at
BEFORE UPDATE ON public.peer_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();