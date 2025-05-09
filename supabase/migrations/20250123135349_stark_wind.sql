/*
  # Add default project and improve project management
  
  1. Add default project
  2. Add indexes for better performance
  3. Add trigger for project updates
*/

-- Insert default project if it doesn't exist
INSERT INTO projects (name, number, site_manager, ctx_manager, cm_ce, active)
SELECT 
  'CTM 378',
  '10185',
  'JPETAIN',
  'LDAIZE',
  'TVAUTRIN',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE number = '10185'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);

-- Create trigger for project updates
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_timestamp
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_timestamp();