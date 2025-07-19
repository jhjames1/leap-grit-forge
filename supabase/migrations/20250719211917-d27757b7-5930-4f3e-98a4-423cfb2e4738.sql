
-- Add a new status for withdrawn proposals
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'withdrawn';

-- Create a function to automatically withdraw pending proposals when a chat session ends
CREATE OR REPLACE FUNCTION withdraw_pending_proposals_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status changes to 'ended'
  IF OLD.status != 'ended' AND NEW.status = 'ended' THEN
    -- Withdraw all pending proposals for this chat session
    UPDATE appointment_proposals 
    SET 
      status = 'withdrawn',
      updated_at = now()
    WHERE 
      chat_session_id = NEW.id 
      AND status = 'pending';
      
    -- Log the withdrawal
    INSERT INTO user_activity_logs (user_id, action, type, details)
    VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      'auto_withdraw_proposals',
      'chat_management',
      json_build_object(
        'session_id', NEW.id,
        'reason', 'chat_session_ended'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_withdraw_proposals_on_session_end ON chat_sessions;
CREATE TRIGGER trigger_withdraw_proposals_on_session_end
  AFTER UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION withdraw_pending_proposals_on_session_end();

-- Clean up existing data: withdraw pending proposals from ended chat sessions
UPDATE appointment_proposals 
SET 
  status = 'withdrawn',
  updated_at = now()
WHERE 
  status = 'pending' 
  AND chat_session_id IN (
    SELECT id FROM chat_sessions WHERE status = 'ended'
  );
