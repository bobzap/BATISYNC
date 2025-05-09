/*
  # Fix personnel RLS policies

  1. Changes
    - Drop existing restrictive policies
    - Create new permissive policy for development
    - Ensure RLS is enabled but allows operations
  
  2. Security
    - Temporary permissive policy for development
    - Should be replaced with proper role-based policies in production
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON personnel;

-- Create maximally permissive policy for development
CREATE POLICY "Enable all operations for authenticated users"
  ON personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;