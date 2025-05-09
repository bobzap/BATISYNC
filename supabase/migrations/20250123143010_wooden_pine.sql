/*
  # Ajout d'index et de politiques pour la table machines

  1. Ajout d'index
    - idx_machines_project_id
    - idx_machines_numero_materiel

  2. Sécurité
    - Politique permissive pour le développement
*/

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_machines_project_id ON machines(project_id);
CREATE INDEX IF NOT EXISTS idx_machines_numero_materiel ON machines(numero_materiel);

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON machines;

-- Créer une politique permissive pour le développement
CREATE POLICY "Enable all operations for authenticated users"
  ON machines FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- S'assurer que RLS est activé
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;