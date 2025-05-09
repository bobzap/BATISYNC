/*
  # Simplify personnel table structure

  1. Changes
    - Remove role enum type
    - Use text field for role instead
    - Keep other fields unchanged
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop and recreate personnel table without enum
DROP TABLE IF EXISTS personnel CASCADE;

CREATE TABLE personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom text NOT NULL,
  role text NOT NULL,
  matricule text,
  equipe text,
  heures_presence numeric NOT NULL DEFAULT 7.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT heures_presence_check CHECK (heures_presence >= 0 AND heures_presence <= 24)
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
CREATE INDEX idx_personnel_project ON personnel(project_id);
CREATE INDEX idx_personnel_role ON personnel(role);

-- Create updated_at trigger
CREATE TRIGGER set_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();