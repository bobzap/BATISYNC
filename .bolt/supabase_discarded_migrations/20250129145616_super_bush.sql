-- Create base personnel table
CREATE TABLE base_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  matricule text UNIQUE NOT NULL,
  role text NOT NULL REFERENCES personnel_fonctions(code) ON UPDATE CASCADE,
  departement text NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  personnel_id uuid NOT NULL REFERENCES base_personnel(id) ON DELETE CASCADE,
  equipe_id uuid REFERENCES project_teams(id) ON DELETE SET NULL,
  atelier_id uuid REFERENCES project_ateliers(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES project_lots(id) ON DELETE SET NULL,
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_fin date,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_personnel_project UNIQUE (project_id, personnel_id)
);

-- Enable RLS
ALTER TABLE base_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ateliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_personnel ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for authenticated users"
  ON base_personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

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
CREATE INDEX idx_base_personnel_matricule ON base_personnel(matricule);
CREATE INDEX idx_base_personnel_role ON base_personnel(role);
CREATE INDEX idx_base_personnel_departement ON base_personnel(departement);
CREATE INDEX idx_base_personnel_actif ON base_personnel(actif);

CREATE INDEX idx_project_teams_project ON project_teams(project_id);
CREATE INDEX idx_project_ateliers_project ON project_ateliers(project_id);
CREATE INDEX idx_project_lots_project ON project_lots(project_id);
CREATE INDEX idx_project_personnel_project ON project_personnel(project_id);
CREATE INDEX idx_project_personnel_personnel ON project_personnel(personnel_id);

-- Add triggers for updated_at
CREATE TRIGGER set_base_personnel_updated_at
  BEFORE UPDATE ON base_personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

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

-- Insert some sample data for base_personnel
INSERT INTO base_personnel (nom, matricule, role, departement) VALUES
  ('Jean Dupont', 'EMP001', 'contremaitre', 'Production'),
  ('Marie Martin', 'EMP002', 'chef_equipe', 'Production'),
  ('Pierre Durand', 'EMP003', 'machiniste', 'Production'),
  ('Sophie Lefebvre', 'EMP004', 'macon', 'Production'),
  ('Lucas Bernard', 'EMP005', 'manoeuvre', 'Production');