-- Supprimer et recréer la table avec des contraintes ajustées
DROP TABLE IF EXISTS project_reference_hours CASCADE;

CREATE TABLE project_reference_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  heures numeric NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Contraintes simplifiées
  CONSTRAINT check_heures_valides CHECK (heures >= 0 AND heures <= 24)
);

-- Index pour les performances
CREATE INDEX idx_reference_hours_project ON project_reference_hours(project_id);
CREATE INDEX idx_reference_hours_dates ON project_reference_hours(date_debut, date_fin);

-- Fonction pour vérifier le chevauchement des périodes
CREATE OR REPLACE FUNCTION check_reference_hours_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Fermer la période active existante si on ajoute une nouvelle période
  IF NEW.date_fin IS NULL THEN
    UPDATE project_reference_hours
    SET date_fin = NEW.date_debut - 1
    WHERE project_id = NEW.project_id
    AND date_fin IS NULL
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour gérer les périodes
CREATE TRIGGER check_reference_hours_overlap_trigger
  BEFORE INSERT OR UPDATE ON project_reference_hours
  FOR EACH ROW
  EXECUTE FUNCTION check_reference_hours_overlap();

-- Fonction pour récupérer les heures de référence à une date donnée
CREATE OR REPLACE FUNCTION get_reference_hours(p_project_id uuid, p_date date)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT heures
      FROM project_reference_hours
      WHERE project_id = p_project_id
      AND date_debut <= p_date
      AND (date_fin IS NULL OR date_fin >= p_date)
      ORDER BY date_debut DESC
      LIMIT 1
    ),
    7.5  -- Valeur par défaut si aucune période trouvée
  );
END;
$$ LANGUAGE plpgsql;