
-- Table to enforce single active session per user
CREATE TABLE public.user_active_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own session record
CREATE POLICY "Users can read own session"
  ON public.user_active_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own session record
CREATE POLICY "Users can upsert own session"
  ON public.user_active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session"
  ON public.user_active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own session on logout
CREATE POLICY "Users can delete own session"
  ON public.user_active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_active_sessions_updated_at
  BEFORE UPDATE ON public.user_active_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
