/*
  # Ajout de l'historique des heures de référence

  1. Nouvelle Table
    - `project_reference_hours`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `heures` (numeric)
      - `date_debut` (date)
      - `date_fin` (date, nullable)
      - `created_at` (timestamptz)
      - `created_by` (uuid)

  2. Contraintes
    - Vérification des heures (0-24h)
    - Vérification des dates (date_fin > date_debut)
    - Unicité des périodes par projet
*/

-- Création de la table d'historique des heures de référence
CREATE TABLE project_reference_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  heures numeric NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT check_heures_valides CHECK (heures >= 0 AND heures <= 24),
  CONSTRAINT check_dates_valides CHECK (date_fin IS NULL OR date_fin > date_debut)
);

-- Index pour les performances
CREATE INDEX idx_reference_hours_project ON project_reference_hours(project_id);
CREATE INDEX idx_reference_hours_dates ON project_reference_hours(date_debut, date_fin);

-- Fonction pour vérifier le chevauchement des périodes
CREATE OR REPLACE FUNCTION check_reference_hours_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM project_reference_hours
    WHERE project_id = NEW.project_id
    AND NEW.id != id  -- Exclure la ligne en cours de modification
    AND (
      (NEW.date_fin IS NULL AND date_fin IS NULL)  -- Les deux sont actives
      OR (NEW.date_fin IS NULL AND date_fin > NEW.date_debut)  -- Nouvelle active, chevauche existante
      OR (date_fin IS NULL AND NEW.date_debut < date_fin)  -- Existante active, chevauche nouvelle
      OR (NEW.date_fin IS NOT NULL AND date_fin IS NOT NULL  -- Les deux ont des dates de fin
          AND (
            (NEW.date_debut BETWEEN date_debut AND date_fin)
            OR (NEW.date_fin BETWEEN date_debut AND date_fin)
            OR (date_debut BETWEEN NEW.date_debut AND NEW.date_fin)
          ))
    )
  ) THEN
    RAISE EXCEPTION 'Les périodes ne peuvent pas se chevaucher pour un même projet';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier les chevauchements
CREATE TRIGGER check_reference_hours_overlap_trigger
  BEFORE INSERT OR UPDATE ON project_reference_hours
  FOR EACH ROW
  EXECUTE FUNCTION check_reference_hours_overlap();

-- Migration des données existantes
INSERT INTO project_reference_hours (
  project_id,
  heures,
  date_debut,
  created_by
)
SELECT 
  id,
  heures_reference,
  CURRENT_DATE,
  (SELECT auth.uid())
FROM projects
WHERE heures_reference IS NOT NULL;