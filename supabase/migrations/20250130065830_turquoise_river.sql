/*
  # Ajout de la table project_personnel

  1. Nouvelle Table
    - `project_personnel`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `personnel_id` (uuid, foreign key)
      - `zone` (text)
      - `equipe` (text)
      - `date_debut` (date)
      - `date_fin` (date, nullable)
      - `statut` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create project_personnel table
CREATE TABLE project_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  personnel_id uuid NOT NULL REFERENCES base_personnel(id) ON DELETE CASCADE,
  zone text,
  equipe text,
  date_debut date NOT NULL,
  date_fin date,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT check_dates_valides CHECK (date_fin IS NULL OR date_fin > date_debut)
);

-- Enable RLS
ALTER TABLE project_personnel ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_project_personnel_project ON project_personnel(project_id);
CREATE INDEX idx_project_personnel_personnel ON project_personnel(personnel_id);
CREATE INDEX idx_project_personnel_statut ON project_personnel(statut);
CREATE INDEX idx_project_personnel_dates ON project_personnel(date_debut, date_fin);

-- Create trigger for updated_at
CREATE TRIGGER set_project_personnel_updated_at
  BEFORE UPDATE ON project_personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create policies
CREATE POLICY "Enable all operations for authenticated users"
  ON project_personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);