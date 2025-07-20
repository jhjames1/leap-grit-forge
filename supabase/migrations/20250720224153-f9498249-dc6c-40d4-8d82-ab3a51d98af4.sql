-- First drop the problematic constraint completely
ALTER TABLE chat_sessions DROP CONSTRAINT check_specialist_status;

-- Update all chat sessions that would be affected to have 'waiting' status
UPDATE chat_sessions 
SET status = 'waiting'
WHERE specialist_id IN (
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

-- Clean up related data
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

-- Now delete the users
DELETE FROM auth.users 
WHERE email IN (
  'jhjames1@aol.com',
  'jjames@modecommunications.net', 
  'katwater@thrivingunited.org',
  'mwright@thrivingunited.org'
);

-- Fix any remaining constraint violations
UPDATE chat_sessions 
SET status = 'waiting'
WHERE specialist_id IS NULL AND status != 'waiting';

-- Recreate the constraint
ALTER TABLE chat_sessions 
ADD CONSTRAINT check_specialist_status 
CHECK ((specialist_id IS NOT NULL) OR (status = 'waiting'::text));

-- Show remaining users
SELECT email FROM auth.users ORDER BY created_at;