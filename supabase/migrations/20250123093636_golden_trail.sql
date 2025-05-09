/*
  # Simplify Role Management

  1. Changes
    - Drop existing role-based policies
    - Create permissive policies for development
    - Keep basic structure for future role implementation

  2. Security
    - Temporarily disable role restrictions
    - Keep RLS enabled but make it permissive
*/

-- Drop existing role-based policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable write access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON projects;

-- Create new permissive policies for development
CREATE POLICY "Temporary full access for authenticated users"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Make project_members table fully accessible
DROP POLICY IF EXISTS "Enable read access for all users" ON project_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON project_members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON project_members;

CREATE POLICY "Temporary full access for authenticated users"
  ON project_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Simplify project creation trigger
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add creator as member without role restriction
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;