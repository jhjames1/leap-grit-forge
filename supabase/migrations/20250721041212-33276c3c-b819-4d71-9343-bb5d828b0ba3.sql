-- Fix RLS for real-time events - the issue is in the SELECT policy
-- The specialist needs to be able to see INSERT events via real-time subscriptions

-- Update the SELECT policy to include real-time event visibility
DROP POLICY IF EXISTS "Session participants can view messages" ON public.chat_messages;

CREATE POLICY "Session participants can view messages" 
ON public.chat_messages 
FOR SELECT 
USING (
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