/*
  # Création de la table base_personnel
  
  1. Nouvelle Table
    - `base_personnel` : Table pour stocker les informations de base du personnel
      - `id` (uuid, primary key)
      - `matricule` (text, unique)
      - `nom` (text)
      - `role` (text, référence personnel_fonctions)
      - `departement` (text)
      - `statut` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create base_personnel table
CREATE TABLE base_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule text UNIQUE NOT NULL,
  nom text NOT NULL,
  role text NOT NULL REFERENCES personnel_fonctions(code),
  departement text NOT NULL,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE base_personnel ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for authenticated users"
  ON base_personnel FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_base_personnel_matricule ON base_personnel(matricule);
CREATE INDEX idx_base_personnel_nom ON base_personnel(nom);
CREATE INDEX idx_base_personnel_role ON base_personnel(role);
CREATE INDEX idx_base_personnel_statut ON base_personnel(statut);

-- Create trigger for updated_at
CREATE TRIGGER set_base_personnel_updated_at
  BEFORE UPDATE ON base_personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insert some example data
INSERT INTO base_personnel (matricule, nom, role, departement, statut) VALUES
  ('M001', 'Jean Dupont', 'contremaitre', 'Production', 'actif'),
  ('M002', 'Marie Martin', 'chef_equipe', 'Production', 'actif'),
  ('M003', 'Pierre Durand', 'machiniste', 'Production', 'actif'),
  ('M004', 'Sophie Lefebvre', 'macon', 'Production', 'actif'),
  ('M005', 'Lucas Bernard', 'manoeuvre', 'Production', 'actif');