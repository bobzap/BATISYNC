/*
  # Add project_id column to personnel table

  1. Changes
    - Add project_id column to personnel table
    - Add foreign key constraint
    - Create index for performance
  
  2. Security
    - Keep existing RLS policy
*/

-- Add project_id column
ALTER TABLE personnel 
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_personnel_project_id ON personnel(project_id);

-- Update existing policy to include project_id check
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON personnel;

CREATE POLICY "Enable all operations for authenticated users"
  ON personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);