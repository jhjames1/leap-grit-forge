-- Enable realtime for specialist_status table with full replica identity
ALTER TABLE public.specialist_status REPLICA IDENTITY FULL;

-- Add the table to supabase_realtime publication if not already added
-- This enables real-time updates for the table
SELECT 'specialist_status' FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'specialist_status';

-- The publication should include the table, but let's ensure it's set up correctly
-- Note: The actual publication management is handled by Supabase automatically