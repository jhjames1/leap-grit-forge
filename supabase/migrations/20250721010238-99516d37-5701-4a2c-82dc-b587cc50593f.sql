-- Fix RLS policies for specialist_status table to allow admin operations

-- Drop existing RLS policies for specialist_status
DROP POLICY IF EXISTS "Specialists can update their own status" ON specialist_status;
DROP POLICY IF EXISTS "Anyone can view specialist status" ON specialist_status;
DROP POLICY IF EXISTS "Allow specialist status updates" ON specialist_status;

-- Create new comprehensive RLS policies for specialist_status
CREATE POLICY "Allow admin to manage all specialist status" 
ON specialist_status 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Allow specialists to view and update their own status" 
ON specialist_status 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM peer_specialists ps 
    WHERE ps.id = specialist_status.specialist_id 
    AND ps.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view specialist status for active specialists" 
ON specialist_status 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM peer_specialists ps 
    WHERE ps.id = specialist_status.specialist_id 
    AND ps.is_active = true
  )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON specialist_status TO authenticated;

-- Ensure the table has proper row level security enabled
ALTER TABLE specialist_status ENABLE ROW LEVEL SECURITY;