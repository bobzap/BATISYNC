/*
  # Ajout des tables pour la gestion du personnel projet
  
  1. Nouvelles Tables
    - `project_teams`: Équipes du projet
    - `project_ateliers`: Ateliers du projet  
    - `project_lots`: Lots du projet
    - `project_personnel`: Affectation du personnel aux projets

  2. Relations
    - Chaque table est liée au projet via project_id
    - project_personnel fait le lien avec base_personnel via Numero_personnel
    - project_personnel peut être lié à une équipe, un atelier et un lot

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques permissives pour le développement
*/

-- Project Teams
CREATE TABLE project_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project Ateliers
CREATE TABLE project_ateliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project Lots
CREATE TABLE project_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project Personnel
CREATE TABLE project_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  Numero_personnel text NOT NULL REFERENCES base_personnel(Numero_personnel) ON DELETE CASCADE,
  equipe_id uuid REFERENCES project_teams(id) ON DELETE SET NULL,
  atelier_id uuid REFERENCES project_ateliers(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES project_lots(id) ON DELETE SET NULL,
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_fin date,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_personnel_project UNIQUE (project_id, Numero_personnel)
);

-- Enable RLS
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ateliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_personnel ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for authenticated users"
  ON project_teams FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON project_ateliers FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON project_lots FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON project_personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_project_teams_project ON project_teams(project_id);
CREATE INDEX idx_project_ateliers_project ON project_ateliers(project_id);
CREATE INDEX idx_project_lots_project ON project_lots(project_id);
CREATE INDEX idx_project_personnel_project ON project_personnel(project_id);
CREATE INDEX idx_project_personnel_personnel ON project_personnel(Numero_personnel);

-- Add triggers for updated_at
CREATE TRIGGER set_project_teams_updated_at
  BEFORE UPDATE ON project_teams
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_project_ateliers_updated_at
  BEFORE UPDATE ON project_ateliers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_project_lots_updated_at
  BEFORE UPDATE ON project_lots
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_project_personnel_updated_at
  BEFORE UPDATE ON project_personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();