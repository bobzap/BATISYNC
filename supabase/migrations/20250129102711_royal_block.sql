/*
  # Ajout de la table personnel_fonctions

  1. Nouvelle Table
    - `personnel_fonctions`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `libelle` (text)
      - `couleur_claire` (text)
      - `couleur_sombre` (text)
      - `ordre` (int)
      - `actif` (boolean)

  2. Données
    - Ajout des fonctions par défaut
    - Mise à jour des rôles existants

  3. Sécurité
    - Enable RLS
    - Ajout des policies
*/

-- Création de la table personnel_fonctions
CREATE TABLE personnel_fonctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  libelle text NOT NULL,
  couleur_claire text NOT NULL,
  couleur_sombre text NOT NULL,
  ordre int NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE personnel_fonctions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Personnel fonctions viewable by everyone"
  ON personnel_fonctions FOR SELECT
  TO authenticated
  USING (true);

-- Trigger pour updated_at
CREATE TRIGGER set_personnel_fonctions_updated_at
  BEFORE UPDATE ON personnel_fonctions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insertion des données
INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre) VALUES
  ('contremaitre', 'Contremaître', 'bg-amber-100 text-amber-800', 'bg-amber-500/20 text-amber-300', 1),
  ('chef_equipe', 'Chef d''équipe', 'bg-blue-100 text-blue-800', 'bg-blue-500/20 text-blue-300', 2),
  ('machiniste', 'Machiniste', 'bg-green-100 text-green-800', 'bg-green-500/20 text-green-300', 3),
  ('grutier', 'Grutier', 'bg-purple-100 text-purple-800', 'bg-purple-500/20 text-purple-300', 4),
  ('macon', 'Maçon', 'bg-pink-100 text-pink-800', 'bg-pink-500/20 text-pink-300', 5),
  ('manoeuvre', 'Manœuvre', 'bg-orange-100 text-orange-800', 'bg-orange-500/20 text-orange-300', 6),
  ('apprenti', 'Apprenti', 'bg-gray-100 text-gray-800', 'bg-gray-500/20 text-gray-300', 7);

-- Création des index
CREATE INDEX idx_personnel_fonctions_code ON personnel_fonctions(code);
CREATE INDEX idx_personnel_fonctions_ordre ON personnel_fonctions(ordre);
CREATE INDEX idx_personnel_fonctions_actif ON personnel_fonctions(actif);