-- Add DELETE policies for appointment management

-- Allow specialists to delete their own appointments from specialist_appointments
CREATE POLICY "Specialists can delete their appointments" 
ON public.specialist_appointments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE peer_specialists.id = specialist_appointments.specialist_id 
  AND peer_specialists.user_id = auth.uid()
));

-- Allow specialists to delete their appointments from scheduled_appointments
CREATE POLICY "Specialists can delete their scheduled appointments" 
ON public.scheduled_appointments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.peer_specialists 
  WHERE peer_specialists.id = scheduled_appointments.specialist_id 
  AND peer_specialists.user_id = auth.uid()
));