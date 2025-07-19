
-- Add session_number column to chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN session_number INTEGER;

-- Create a sequence for session numbering starting at 1000
CREATE SEQUENCE IF NOT EXISTS session_number_seq START 1000;

-- Update existing records with sequential session numbers based on creation order
WITH numbered_sessions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) + 999 as new_session_number
  FROM public.chat_sessions 
  WHERE session_number IS NULL
)
UPDATE public.chat_sessions 
SET session_number = numbered_sessions.new_session_number
FROM numbered_sessions
WHERE public.chat_sessions.id = numbered_sessions.id;

-- Set default value for new records and make it NOT NULL
ALTER TABLE public.chat_sessions 
ALTER COLUMN session_number SET DEFAULT nextval('session_number_seq'),
ALTER COLUMN session_number SET NOT NULL;

-- Add unique constraint to ensure no duplicate session numbers
ALTER TABLE public.chat_sessions 
ADD CONSTRAINT unique_session_number UNIQUE (session_number);

-- Update the sequence to continue from the highest existing number
SELECT setval('session_number_seq', COALESCE(MAX(session_number), 999) + 1, false) 
FROM public.chat_sessions;
