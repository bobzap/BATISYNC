/*
  # Fix Project Policies and Schema

  1. Changes
    - Drop existing policies
    - Create new simplified policies for development
    - Add missing indexes
    - Fix project member handling

  2. Security
    - Enable RLS
    - Add basic policies for development
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable write access for all users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all users" ON projects;

-- Create new simplified policies for development
CREATE POLICY "Enable read access for all authenticated users"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for all authenticated users"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for all authenticated users"
  ON projects FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(active);
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(number);

-- Function to handle new projects
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new projects
DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_new_project();