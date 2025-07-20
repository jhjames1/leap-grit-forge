-- Let's check what constraint is causing the issue and fix the data
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conname = 'check_specialist_status';

-- Fix problematic chat sessions that have null specialist but non-waiting status
UPDATE chat_sessions 
SET status = 'waiting'
WHERE specialist_id IS NULL AND status != 'waiting';

-- Now safely delete the users - this will cascade to remove related records
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Verify the users are deleted
SELECT count(*) as remaining_users_count, 
       array_agg(email) as remaining_emails 
FROM auth.users;