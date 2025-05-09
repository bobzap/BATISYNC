/*
  # Fix project creation policies

  1. Changes
    - Add more permissive policies for project creation
    - Add default user role on project creation
    - Add trigger to automatically add creator as admin
    
  2. Security
    - Maintain basic RLS protection
    - Allow authenticated users to create projects
    - Auto-assign admin role to project creator
*/

-- Create function to add project creator as admin
CREATE OR REPLACE FUNCTION add_project_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add creator as admin
DROP TRIGGER IF EXISTS project_creator_admin ON projects;
CREATE TRIGGER project_creator_admin
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_admin();

-- Update project policies to be more permissive during development
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Project members can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add policy for project members
CREATE POLICY "Project members can manage their own membership"
  ON project_members FOR ALL
  TO authenticated
  USING (user_id = auth.uid());