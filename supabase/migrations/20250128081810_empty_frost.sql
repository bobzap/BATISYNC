/*
  # Gestion des heures de référence par projet

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
    - Heures entre 0 et 24
    - Date de fin optionnelle mais > date de début si présente
    - Pas de chevauchement de périodes pour un même projet

  3. Indexes
    - project_id
    - dates (pour les recherches par période)
*/

-- Suppression de la table si elle existe déjà
DROP TABLE IF EXISTS project_reference_hours CASCADE;

-- Création de la table
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
  -- Vérifier s'il existe déjà une période active pour ce projet
  IF NEW.date_fin IS NULL AND EXISTS (
    SELECT 1 FROM project_reference_hours
    WHERE project_id = NEW.project_id
    AND id != NEW.id
    AND date_fin IS NULL
  ) THEN
    RAISE EXCEPTION 'Il ne peut y avoir qu''une seule période active à la fois';
  END IF;

  -- Vérifier les chevauchements de périodes
  IF EXISTS (
    SELECT 1 FROM project_reference_hours
    WHERE project_id = NEW.project_id
    AND id != NEW.id
    AND (
      (NEW.date_fin IS NULL AND date_fin > NEW.date_debut)
      OR (date_fin IS NOT NULL AND NEW.date_fin IS NOT NULL
          AND (
            (NEW.date_debut BETWEEN date_debut AND date_fin)
            OR (NEW.date_fin BETWEEN date_debut AND date_fin)
            OR (date_debut BETWEEN NEW.date_debut AND NEW.date_fin)
          ))
    )
  ) THEN
    RAISE EXCEPTION 'Les périodes ne peuvent pas se chevaucher';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier les chevauchements
CREATE TRIGGER check_reference_hours_overlap_trigger
  BEFORE INSERT OR UPDATE ON project_reference_hours
  FOR EACH ROW
  EXECUTE FUNCTION check_reference_hours_overlap();

-- Fonction pour récupérer les heures de référence à une date donnée
CREATE OR REPLACE FUNCTION get_reference_hours(p_project_id uuid, p_date date)
RETURNS numeric AS $$
BEGIN
  RETURN (
    SELECT heures
    FROM project_reference_hours
    WHERE project_id = p_project_id
    AND date_debut <= p_date
    AND (date_fin IS NULL OR date_fin >= p_date)
    ORDER BY date_debut DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;