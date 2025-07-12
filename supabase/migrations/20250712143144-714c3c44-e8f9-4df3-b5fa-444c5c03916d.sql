-- Update specialist_status table to support real-time tracking
ALTER TABLE public.specialist_status 
ADD COLUMN IF NOT EXISTS presence_data JSONB DEFAULT NULL;

-- Enable realtime for specialist status tracking
ALTER TABLE public.specialist_status REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'specialist_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.specialist_status;
  END IF;
END $$;
COMMIT;