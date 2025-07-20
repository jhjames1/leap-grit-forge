-- Temporarily disable the constraint to allow the cascading deletion
ALTER TABLE chat_sessions DISABLE TRIGGER ALL;

-- Delete the users - this will cascade and remove related records
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Re-enable triggers
ALTER TABLE chat_sessions ENABLE TRIGGER ALL;

-- Clean up any orphaned chat sessions that might now violate the constraint
UPDATE chat_sessions 
SET status = 'waiting'
WHERE specialist_id IS NULL AND status != 'waiting';

-- Verify the users are deleted
SELECT count(*) as remaining_users_count, 
       array_agg(email) as remaining_emails 
FROM auth.users;