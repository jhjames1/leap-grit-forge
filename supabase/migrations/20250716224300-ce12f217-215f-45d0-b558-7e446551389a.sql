-- Add RLS policy for admins to update peer specialists
CREATE POLICY "Admins can update specialist profiles" 
ON public.peer_specialists 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Also add policy for admins to delete specialists (for completeness)
CREATE POLICY "Admins can delete specialist profiles" 
ON public.peer_specialists 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);