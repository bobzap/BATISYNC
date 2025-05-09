/*
  # Simplify Database Access

  1. Changes
    - Drop all existing policies
    - Create simple permissive policies
    - Remove role restrictions temporarily

  2. Security Note
    - This is for development only
    - Security will be properly implemented later
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Temporary full access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Temporary full access for authenticated users" ON project_members;

-- Create maximally permissive policies for development
CREATE POLICY "Allow all operations"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations"
  ON project_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but permissive
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Simplify project creation
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;