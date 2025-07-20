-- Fix the check constraint violations first
-- Update all chat sessions with null specialist_id to have 'waiting' status
UPDATE chat_sessions 
SET status = 'waiting'
WHERE specialist_id IS NULL AND status != 'waiting';

-- Now proceed with the deletion
-- Clean up related data first
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

-- Delete the users (this should cascade to other tables)
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Verify deletion
SELECT email FROM auth.users ORDER BY created_at;