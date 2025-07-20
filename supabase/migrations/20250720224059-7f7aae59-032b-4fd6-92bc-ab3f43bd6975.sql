-- Drop the check constraint temporarily
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS check_specialist_status;

-- Clean up related data for the users we want to delete
-- Delete peer monthly metrics for the specialists
DELETE FROM peer_monthly_metrics 
WHERE peer_id IN (
  SELECT id FROM peer_specialists ps 
  WHERE ps.user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'jhjames1@aol.com',
      'jjames@modecommunications.net', 
      'katwater@thrivingunited.org',
      'mwright@thrivingunited.org'
    )
  )
);

-- Delete peer performance events
DELETE FROM peer_performance_events 
WHERE peer_id IN (
  SELECT id FROM peer_specialists ps 
  WHERE ps.user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'jhjames1@aol.com',
      'jjames@modecommunications.net', 
      'katwater@thrivingunited.org',
      'mwright@thrivingunited.org'
    )
  )
);

-- Delete peer checkins
DELETE FROM peer_checkins 
WHERE peer_id IN (
  SELECT id FROM peer_specialists ps 
  WHERE ps.user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'jhjames1@aol.com',
      'jjames@modecommunications.net', 
      'katwater@thrivingunited.org',
      'mwright@thrivingunited.org'
    )
  )
);

-- Delete peer session ratings
DELETE FROM peer_session_ratings 
WHERE peer_id IN (
  SELECT id FROM peer_specialists ps 
  WHERE ps.user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'jhjames1@aol.com',
      'jjames@modecommunications.net', 
      'katwater@thrivingunited.org',
      'mwright@thrivingunited.org'
    )
  )
);

-- Now delete the users
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

-- Verify the deletion
SELECT count(*) as remaining_users, array_agg(email) as emails 
FROM auth.users;