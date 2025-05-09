/*
  # Fix Project Member Creation

  1. Changes
    - Drop existing project_members table
    - Recreate with proper constraints
    - Update trigger function
    - Add policies

  2. Security
    - Temporarily permissive for development
*/

-- Drop existing table and recreate
DROP TABLE IF EXISTS project_members CASCADE;

CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid,
  role project_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for development
CREATE POLICY "Allow all operations"
  ON project_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update the trigger function
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;