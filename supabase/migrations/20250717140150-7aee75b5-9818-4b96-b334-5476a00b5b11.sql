-- Add gender field to user preferences table
ALTER TABLE public.user_preferences
ADD COLUMN gender text;