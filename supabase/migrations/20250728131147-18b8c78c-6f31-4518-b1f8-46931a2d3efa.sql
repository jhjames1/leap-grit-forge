-- Create table to track specialist content usage and analytics
CREATE TABLE IF NOT EXISTS public.specialist_content_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.foreman_content(id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  content_category TEXT NOT NULL,
  content_type TEXT NOT NULL,
  context_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialist_content_usage_specialist_id ON public.specialist_content_usage(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_content_usage_content_id ON public.specialist_content_usage(content_id);
CREATE INDEX IF NOT EXISTS idx_specialist_content_usage_session_id ON public.specialist_content_usage(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_specialist_content_usage_shared_at ON public.specialist_content_usage(shared_at);

-- Enable RLS
ALTER TABLE public.specialist_content_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Specialists can view their own usage" 
ON public.specialist_content_usage 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.peer_specialists ps 
  WHERE ps.id = specialist_content_usage.specialist_id 
  AND ps.user_id = auth.uid()
));

CREATE POLICY "Specialists can insert their own usage" 
ON public.specialist_content_usage 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.peer_specialists ps 
  WHERE ps.id = specialist_content_usage.specialist_id 
  AND ps.user_id = auth.uid()
));

CREATE POLICY "Admins can view all usage" 
ON public.specialist_content_usage 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
));

-- Add trigger to update content usage count
CREATE OR REPLACE FUNCTION public.update_content_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the usage count in foreman_content
  UPDATE public.foreman_content 
  SET usage_count = usage_count + 1
  WHERE id = NEW.content_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_content_usage_count
  AFTER INSERT ON public.specialist_content_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_usage_count();