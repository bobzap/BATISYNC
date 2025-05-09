/*
  # Disable RLS for development

  1. Changes
    - Disable RLS on personnel table for development
    - Create permissive policy for all operations
  
  2. Security
    - WARNING: This is for development only!
    - Should be replaced with proper RLS in production
*/

-- Disable RLS temporarily
ALTER TABLE personnel DISABLE ROW LEVEL SECURITY;

-- Create permissive policy for all operations
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON personnel;

CREATE POLICY "Enable all operations for authenticated users"
  ON personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);