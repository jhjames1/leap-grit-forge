-- Phase 1: Database Schema Enhancement
-- Create comprehensive user data tables for cross-device persistence

-- User activity logs table
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User toolbox statistics table
CREATE TABLE public.user_toolbox_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tools_used_today INTEGER NOT NULL DEFAULT 0,
  total_tools_used INTEGER NOT NULL DEFAULT 0,
  favorite_tools TEXT[],
  last_tool_used TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User gratitude entries table
CREATE TABLE public.user_gratitude_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_text TEXT NOT NULL,
  date DATE NOT NULL,
  mood_rating INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User journey progress table
CREATE TABLE public.user_journey_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journey_stage TEXT NOT NULL DEFAULT 'initial',
  focus_areas TEXT[],
  support_style TEXT,
  current_day INTEGER NOT NULL DEFAULT 1,
  completed_days INTEGER NOT NULL DEFAULT 0,
  journey_responses JSONB,
  daily_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'system',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_opt_in BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  timezone TEXT,
  recovery_start_date DATE,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User daily stats table
CREATE TABLE public.user_daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  actions_completed INTEGER NOT NULL DEFAULT 0,
  tools_used TEXT[],
  journey_activities TEXT[],
  recovery_strength NUMERIC DEFAULT 0,
  wellness_level TEXT DEFAULT 'neutral',
  mood_entries JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_toolbox_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_activity_logs
CREATE POLICY "Users can view their own activity logs"
ON public.user_activity_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs"
ON public.user_activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
ON public.user_activity_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create RLS policies for user_toolbox_stats
CREATE POLICY "Users can view their own toolbox stats"
ON public.user_toolbox_stats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own toolbox stats"
ON public.user_toolbox_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own toolbox stats"
ON public.user_toolbox_stats
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all toolbox stats"
ON public.user_toolbox_stats
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create RLS policies for user_gratitude_entries
CREATE POLICY "Users can manage their own gratitude entries"
ON public.user_gratitude_entries
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gratitude entries"
ON public.user_gratitude_entries
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create RLS policies for user_journey_progress
CREATE POLICY "Users can manage their own journey progress"
ON public.user_journey_progress
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all journey progress"
ON public.user_journey_progress
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create RLS policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
ON public.user_preferences
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create RLS policies for user_daily_stats
CREATE POLICY "Users can manage their own daily stats"
ON public.user_daily_stats
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily stats"
ON public.user_daily_stats
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create indexes for performance
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_timestamp ON public.user_activity_logs(timestamp);
CREATE INDEX idx_user_activity_logs_type ON public.user_activity_logs(type);
CREATE INDEX idx_user_gratitude_entries_user_id ON public.user_gratitude_entries(user_id);
CREATE INDEX idx_user_gratitude_entries_date ON public.user_gratitude_entries(date);
CREATE INDEX idx_user_daily_stats_user_id ON public.user_daily_stats(user_id);
CREATE INDEX idx_user_daily_stats_date ON public.user_daily_stats(date);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_user_toolbox_stats_updated_at
BEFORE UPDATE ON public.user_toolbox_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gratitude_entries_updated_at
BEFORE UPDATE ON public.user_gratitude_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_journey_progress_updated_at
BEFORE UPDATE ON public.user_journey_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_daily_stats_updated_at
BEFORE UPDATE ON public.user_daily_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();