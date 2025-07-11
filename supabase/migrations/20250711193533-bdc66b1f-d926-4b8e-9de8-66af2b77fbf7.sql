-- Enable real-time updates for specialist_status table
ALTER TABLE public.specialist_status REPLICA IDENTITY FULL;

-- Add specialist_status table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.specialist_status;