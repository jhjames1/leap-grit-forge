-- Update the category check constraint to include all categories used by the frontend
ALTER TABLE public.foreman_content 
DROP CONSTRAINT foreman_content_category_check;

ALTER TABLE public.foreman_content 
ADD CONSTRAINT foreman_content_category_check 
CHECK (category = ANY (ARRAY[
  'crisis_support'::text,
  'daily_motivation'::text, 
  'recovery_education'::text,
  'success_stories'::text,
  'milestone_celebrations'::text,
  'self_care'::text,
  'coping_strategies'::text,
  'inspiration'::text,
  'breathing_exercises'::text,
  'motivation'::text,
  'educational'::text,
  'mindfulness'::text
]));