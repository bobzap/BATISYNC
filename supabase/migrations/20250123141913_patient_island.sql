/*
  # Update machines table policies

  1. Changes
    - Drop existing policies
    - Create new permissive policies for development
    - Add missing indexes if needed

  2. Security
    - Enable RLS with permissive policies for development
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view machines for their projects" ON machines;
DROP POLICY IF EXISTS "Users can insert machines" ON machines;
DROP POLICY IF EXISTS "Users can update machines" ON machines;
DROP POLICY IF EXISTS "Users can delete machines" ON machines;

-- Create permissive policy for development
CREATE POLICY "Enable all operations for authenticated users"
  ON machines FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create additional indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_entreprise ON machines(entreprise);