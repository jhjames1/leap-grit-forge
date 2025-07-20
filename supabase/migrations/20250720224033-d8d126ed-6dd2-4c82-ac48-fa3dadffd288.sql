-- First, let's identify what the constraint check actually is
SELECT pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'check_specialist_status';

-- Drop the constraint temporarily
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS check_specialist_status;

-- Now delete the users safely
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Recreate the constraint
ALTER TABLE chat_sessions 
ADD CONSTRAINT check_specialist_status 
CHECK ((specialist_id IS NOT NULL) OR (status = 'waiting'::text));

-- Show final user count
SELECT count(*) as total_users, array_agg(email) as emails 
FROM auth.users;