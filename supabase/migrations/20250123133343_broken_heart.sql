/*
  # Fix personnel table structure

  1. Changes
    - Drop and recreate personnel table with simpler structure
    - Remove complex constraints
    - Add basic indexes
    - Create simple RLS policies
  
  2. Security
    - Enable RLS
    - Create permissive policy for development
*/

-- Drop existing table
DROP TABLE IF EXISTS personnel CASCADE;

-- Create simplified personnel table
CREATE TABLE personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  role text NOT NULL,
  matricule text,
  equipe text,
  heures_presence numeric NOT NULL DEFAULT 7.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for development
CREATE POLICY "Enable all operations for authenticated users"
  ON personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_personnel_nom ON personnel(nom);
CREATE INDEX idx_personnel_role ON personnel(role);

-- Create updated_at trigger
CREATE TRIGGER set_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();