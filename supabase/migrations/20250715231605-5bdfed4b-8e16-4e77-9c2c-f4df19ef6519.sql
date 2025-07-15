-- Fix category CHECK constraint and add language column
ALTER TABLE public.foreman_content 
DROP CONSTRAINT IF EXISTS foreman_content_category_check;

ALTER TABLE public.foreman_content 
ADD CONSTRAINT foreman_content_category_check 
CHECK (category IN ('motivation', 'coping_strategies', 'educational', 'mindfulness', 'breathing_exercises', 'crisis_support', 'daily_motivation', 'success_stories', 'milestone_celebrations'));

-- Add language column with default 'en'
ALTER TABLE public.foreman_content 
ADD COLUMN language VARCHAR(10) NOT NULL DEFAULT 'en';

-- Create index on language for better performance
CREATE INDEX idx_foreman_content_language ON public.foreman_content(language);

-- Create index on category and language combination
CREATE INDEX idx_foreman_content_category_language ON public.foreman_content(category, language);