
-- Update the appointment_proposals frequency check constraint to include 'once'
ALTER TABLE public.appointment_proposals 
DROP CONSTRAINT IF EXISTS appointment_proposals_frequency_check;

ALTER TABLE public.appointment_proposals 
ADD CONSTRAINT appointment_proposals_frequency_check 
CHECK (frequency IN ('once', 'weekly', 'biweekly', 'monthly'));
