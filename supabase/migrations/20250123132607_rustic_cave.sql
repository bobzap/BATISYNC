/*
  # Simplify RLS policies for development
  
  1. Changes
    - Remove role-based restrictions
    - Enable full access for authenticated users
    - Keep table structure unchanged
    
  2. Security
    - Temporarily disable role checks for development
    - Will need to be replaced with proper role-based policies before production
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for all tables" ON personnel;
DROP POLICY IF EXISTS "Enable all operations for all tables" ON projects;
DROP POLICY IF EXISTS "Enable all operations for all tables" ON project_members;

-- Create maximally permissive policies for development
CREATE POLICY "Enable all operations for authenticated users"
  ON personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON projects FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON project_members FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but permissive
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;