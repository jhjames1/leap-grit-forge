-- Delete the specified users from auth.users
-- This will cascade and remove related data in other tables
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Verify the users have been removed
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Show remaining users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at;