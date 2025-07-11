-- Add INSERT policy to allow creating specialists
CREATE POLICY "Allow authenticated users to create specialists" 
ON public.peer_specialists 
FOR INSERT 
TO authenticated 
WITH CHECK (true);