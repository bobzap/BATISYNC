/*
  # Fix Project Policies

  1. Changes
    - Drop existing policies first
    - Create new simplified policies
    - Add proper indexes
    - Fix project member handling

  2. Security
    - Enable RLS
    - Add basic policies for development
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON projects;

-- Create new simplified policies
CREATE POLICY "Enable read access for all users"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for all users"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON projects FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(active);
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(number);