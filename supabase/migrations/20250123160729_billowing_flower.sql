-- Table des rapports journaliers
CREATE TABLE daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  -- Visa contremaitre
  visa_contremaitre boolean DEFAULT false,
  visa_date timestamptz,
  visa_user_id uuid REFERENCES auth.users(id),
  
  -- Informations générales
  meteo jsonb NOT NULL DEFAULT '{
    "condition": "ensoleille",
    "temperature": 20
  }',
  
  -- Événements particuliers
  evenements_particuliers jsonb NOT NULL DEFAULT '{
    "betonnage": false,
    "essais": false,
    "poseEnrobe": false,
    "controleExtInt": false,
    "reception": false
  }',
  
  -- Personnel présent
  personnel jsonb NOT NULL DEFAULT '[]',
  
  -- Sections
  taches jsonb NOT NULL DEFAULT '[]',
  machines jsonb NOT NULL DEFAULT '[]',
  bons_apport jsonb NOT NULL DEFAULT '[]',
  bons_evacuation jsonb NOT NULL DEFAULT '[]',
  bons_beton jsonb NOT NULL DEFAULT '[]',
  bons_materiaux jsonb NOT NULL DEFAULT '[]',
  tiers jsonb NOT NULL DEFAULT '[]',
  
  -- Remarques
  remarques text,
  remarques_contremaitre text,
  
  -- Photos et documents
  photos jsonb NOT NULL DEFAULT '[]',
  
  -- Métadonnées
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  
  -- Contrainte d'unicité sur la date et le projet
  UNIQUE(project_id, date)
);

-- Index pour les performances
CREATE INDEX idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date);
CREATE INDEX idx_daily_reports_visa ON daily_reports(visa_contremaitre);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER set_daily_reports_updated_at
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Fonction pour mettre à jour le visa contremaitre
CREATE OR REPLACE FUNCTION update_visa_contremaitre()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visa_contremaitre = true AND OLD.visa_contremaitre = false THEN
    NEW.visa_date = now();
    NEW.visa_user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour du visa
CREATE TRIGGER on_visa_update
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW
  WHEN (NEW.visa_contremaitre IS DISTINCT FROM OLD.visa_contremaitre)
  EXECUTE FUNCTION update_visa_contremaitre();