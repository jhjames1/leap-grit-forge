-- Fix RLS policy for chat_messages to allow real-time events
-- The specialist needs to see INSERT events for their active sessions

-- Add INSERT permission with USING clause so real-time events work
DROP POLICY IF EXISTS "Session participants can insert messages" ON public.chat_messages;

CREATE POLICY "Session participants can insert messages" 
ON public.chat_messages 
FOR INSERT 
USING (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM chat_sessions cs 
    WHERE cs.id = chat_messages.session_id 
    AND (
      cs.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM peer_specialists ps 
        WHERE ps.id = cs.specialist_id AND ps.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM chat_sessions cs 
    WHERE cs.id = chat_messages.session_id 
    AND (
      cs.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM peer_specialists ps 
        WHERE ps.id = cs.specialist_id AND ps.user_id = auth.uid()
      )
    )
  )
);