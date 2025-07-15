-- Create foreman_content table for user-facing content
CREATE TABLE public.foreman_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('quote', 'story', 'audio', 'video', 'image', 'article', 'resource')),
  category TEXT NOT NULL CHECK (category IN ('crisis_support', 'daily_motivation', 'recovery_education', 'success_stories', 'milestone_celebrations', 'self_care', 'coping_strategies', 'inspiration')),
  media_url TEXT,
  author TEXT,
  mood_targeting TEXT[] DEFAULT '{}', -- Target specific moods: anxious, hopeful, struggling, etc.
  recovery_stage TEXT[] DEFAULT '{}', -- Target recovery stages: early, maintenance, relapse_prevention
  trigger_keywords TEXT[] DEFAULT '{}', -- Keywords that should trigger this content
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10), -- Higher priority content shown first
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 10.0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.foreman_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active foreman content
CREATE POLICY "Anyone can view active foreman content" 
ON public.foreman_content 
FOR SELECT 
USING (is_active = true);

-- Policy: Only admins can manage foreman content
CREATE POLICY "Admins can manage foreman content" 
ON public.foreman_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_foreman_content_updated_at
BEFORE UPDATE ON public.foreman_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_foreman_content_category ON public.foreman_content(category);
CREATE INDEX idx_foreman_content_mood_targeting ON public.foreman_content USING GIN(mood_targeting);
CREATE INDEX idx_foreman_content_recovery_stage ON public.foreman_content USING GIN(recovery_stage);
CREATE INDEX idx_foreman_content_trigger_keywords ON public.foreman_content USING GIN(trigger_keywords);
CREATE INDEX idx_foreman_content_priority ON public.foreman_content(priority DESC);
CREATE INDEX idx_foreman_content_active ON public.foreman_content(is_active);

-- Insert some sample content
INSERT INTO public.foreman_content (title, content, content_type, category, mood_targeting, recovery_stage, trigger_keywords, priority) VALUES
('Daily Affirmation', 'Today I choose recovery. Every moment is a chance to start fresh and make choices that honor my commitment to healing.', 'quote', 'daily_motivation', '{"hopeful", "determined"}', '{"early", "maintenance"}', '{"motivation", "daily", "affirmation"}', 8),
('Crisis Helpline', 'Remember: You are not alone. National Suicide Prevention Lifeline: 988. Crisis Text Line: Text HOME to 741741. Reach out - there are people who want to help.', 'resource', 'crisis_support', '{"crisis", "desperate", "suicidal"}', '{"early", "maintenance", "relapse_prevention"}', '{"crisis", "help", "suicide", "emergency"}', 10),
('One Year Celebration', 'Congratulations on reaching one year! This milestone represents 365 days of choosing yourself, your health, and your future. You''ve proven your strength - celebrate this incredible achievement!', 'story', 'milestone_celebrations', '{"proud", "accomplished"}', '{"maintenance"}', '{"anniversary", "year", "milestone", "celebration"}', 9);