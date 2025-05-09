/*
  # Update personnel table

  1. Changes
    - Add project_id column
    - Update RLS policies
    - Add indexes for performance

  2. Security
    - Update policies for project-based access
*/

-- Add project_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personnel' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE personnel 
    ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Personnel is viewable by everyone" ON personnel;
DROP POLICY IF EXISTS "Users can insert their own personnel" ON personnel;
DROP POLICY IF EXISTS "Users can update their own personnel" ON personnel;

-- Create new project-based policies
CREATE POLICY "Users can view personnel for their projects"
  ON personnel FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert personnel in their projects"
  ON personnel FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update personnel in their projects"
  ON personnel FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete personnel in their projects"
  ON personnel FOR DELETE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create index for project_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_personnel_project ON personnel(project_id);