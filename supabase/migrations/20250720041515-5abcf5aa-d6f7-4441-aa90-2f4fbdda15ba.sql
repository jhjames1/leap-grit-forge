
-- Update the SELECT policy on chat_sessions to allow verified specialists to view unassigned waiting sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.chat_sessions;

CREATE POLICY "Users and specialists can view relevant sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (
  -- Users can view their own sessions
  (auth.uid() = user_id) 
  OR 
  -- Specialists can view sessions assigned to them
  (EXISTS ( SELECT 1
   FROM peer_specialists
  WHERE ((peer_specialists.id = chat_sessions.specialist_id) AND (peer_specialists.user_id = auth.uid()))))
  OR
  -- Verified specialists can view unassigned waiting sessions
  (specialist_id IS NULL AND status = 'waiting' AND EXISTS (
    SELECT 1 FROM peer_specialists 
    WHERE user_id = auth.uid() AND is_verified = true AND is_active = true
  ))
);
