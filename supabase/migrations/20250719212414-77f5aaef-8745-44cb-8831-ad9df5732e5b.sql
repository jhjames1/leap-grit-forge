
-- Clean up remaining pending proposals from ended chat sessions
UPDATE appointment_proposals 
SET 
  status = 'withdrawn',
  updated_at = now()
WHERE 
  status = 'pending' 
  AND chat_session_id IN (
    SELECT id FROM chat_sessions WHERE status = 'ended'
  );

-- Verify the cleanup worked by checking counts
SELECT 
  ap.status,
  cs.status as chat_status,
  COUNT(*) as count
FROM appointment_proposals ap
LEFT JOIN chat_sessions cs ON ap.chat_session_id = cs.id
GROUP BY ap.status, cs.status
ORDER BY ap.status, cs.status;
