/*
  # Create machines table

  1. New Tables
    - `machines`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `nom` (text)
      - `type` (text)
      - `numero_materiel` (text)
      - `entreprise` (text)
      - `quantite` (integer)
      - `remarques` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `machines` table
    - Add policies for authenticated users
    - Add indexes for performance

  3. Changes
    - Add trigger for updated_at timestamp
*/

-- Create machines table
CREATE TABLE machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type text NOT NULL,
  numero_materiel text NOT NULL,
  entreprise text NOT NULL,
  quantite integer DEFAULT 1,
  remarques text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view machines for their projects"
  ON machines FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert machines"
  ON machines FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update machines"
  ON machines FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete machines"
  ON machines FOR DELETE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_machines_project ON machines(project_id);
CREATE INDEX idx_machines_numero ON machines(numero_materiel);

-- Create updated_at trigger
CREATE TRIGGER set_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();