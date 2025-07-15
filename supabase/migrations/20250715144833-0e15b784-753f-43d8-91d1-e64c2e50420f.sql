-- Create thought packs table for CBT Thought Pattern Sorter game
CREATE TABLE public.thought_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'base',
  is_active BOOLEAN NOT NULL DEFAULT true,
  unlock_requirement INTEGER DEFAULT 0, -- days streak required to unlock
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create thought items table
CREATE TABLE public.thought_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL,
  text TEXT NOT NULL,
  is_distortion BOOLEAN NOT NULL, -- true = distortion, false = realistic
  category TEXT DEFAULT 'general',
  difficulty INTEGER DEFAULT 1, -- 1-3 scale
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (pack_id) REFERENCES thought_packs(id) ON DELETE CASCADE
);

-- Create user game sessions table to track progress
CREATE TABLE public.cbt_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  correct_items INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (pack_id) REFERENCES thought_packs(id) ON DELETE CASCADE
);

-- Create user game streaks table
CREATE TABLE public.cbt_game_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_played_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.thought_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thought_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_game_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for thought_packs (public read)
CREATE POLICY "Anyone can view active thought packs"
ON public.thought_packs
FOR SELECT
USING (is_active = true);

-- RLS policies for thought_items (public read)
CREATE POLICY "Anyone can view thought items"
ON public.thought_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM thought_packs tp 
  WHERE tp.id = thought_items.pack_id AND tp.is_active = true
));

-- RLS policies for cbt_game_sessions (user-specific)
CREATE POLICY "Users can view their own game sessions"
ON public.cbt_game_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions"
ON public.cbt_game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for cbt_game_streaks (user-specific)
CREATE POLICY "Users can view their own game streaks"
ON public.cbt_game_streaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game streaks"
ON public.cbt_game_streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game streaks"
ON public.cbt_game_streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_thought_packs_updated_at
  BEFORE UPDATE ON public.thought_packs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_thought_items_updated_at
  BEFORE UPDATE ON public.thought_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cbt_game_streaks_updated_at
  BEFORE UPDATE ON public.cbt_game_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert base thought pack with sample data
INSERT INTO public.thought_packs (title, description, theme, is_active) VALUES
('Daily CBT Pack', 'Essential cognitive patterns for daily practice', 'base', true),
('Work Stress Pack', 'Thoughts related to workplace pressure', 'work-stress', true),
('Relationship Pack', 'Common relationship-related thinking patterns', 'relationships', true);

-- Insert thought items for the base pack
INSERT INTO public.thought_items (pack_id, text, is_distortion, category) VALUES
-- Get the base pack ID first
((SELECT id FROM thought_packs WHERE theme = 'base'), 'I always fail at everything', true, 'catastrophizing'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'This is a learning opportunity', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'Everyone thinks I''m stupid', true, 'mind-reading'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'I can handle this step by step', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'I should be perfect at this', true, 'should-statements'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'Mistakes help me improve', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'This will never work out', true, 'fortune-telling'),
((SELECT id FROM thought_packs WHERE theme = 'base'), 'I can try different approaches', false, 'realistic');

-- Insert work stress pack items
INSERT INTO public.thought_items (pack_id, text, is_distortion, category) VALUES
((SELECT id FROM thought_packs WHERE theme = 'work-stress'), 'I''ll never meet this deadline', true, 'catastrophizing'),
((SELECT id FROM thought_packs WHERE theme = 'work-stress'), 'I can prioritize and ask for help', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'work-stress'), 'My boss hates me', true, 'mind-reading'),
((SELECT id FROM thought_packs WHERE theme = 'work-stress'), 'I can communicate my concerns', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'work-stress'), 'I should work all weekend', true, 'should-statements'),
((SELECT id FROM thought_packs WHERE theme = 'work-stress'), 'I deserve rest and balance', false, 'realistic');

-- Insert relationship pack items
INSERT INTO public.thought_items (pack_id, text, is_distortion, category) VALUES
((SELECT id FROM thought_packs WHERE theme = 'relationships'), 'They don''t care about me', true, 'mind-reading'),
((SELECT id FROM thought_packs WHERE theme = 'relationships'), 'I can express my feelings openly', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'relationships'), 'I''m not good enough for them', true, 'self-worth'),
((SELECT id FROM thought_packs WHERE theme = 'relationships'), 'I have unique qualities to offer', false, 'realistic'),
((SELECT id FROM thought_packs WHERE theme = 'relationships'), 'This argument ruins everything', true, 'catastrophizing'),
((SELECT id FROM thought_packs WHERE theme = 'relationships'), 'We can work through this together', false, 'realistic');