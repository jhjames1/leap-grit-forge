-- First, let's see what the constraint issue is
SELECT constraint_name, constraint_type, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_specialist_status';

-- Let's examine the problematic chat sessions
SELECT id, user_id, specialist_id, status, started_at, ended_at 
FROM chat_sessions 
WHERE specialist_id IS NULL AND status != 'waiting';

-- Fix the constraint violation by updating sessions with null specialist_id to have 'waiting' status
UPDATE chat_sessions 
SET status = 'waiting'
WHERE specialist_id IS NULL AND status != 'waiting';

-- Now delete the users
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Verify deletion
SELECT email FROM auth.users ORDER BY created_at;