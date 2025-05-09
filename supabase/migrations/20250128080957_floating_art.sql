/*
  # Mise à jour des heures de référence

  1. Ajout d'un index sur la colonne existante
  2. Ajout d'une contrainte de validation
*/

-- Création d'un index pour les performances si non existant
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'projects' 
    AND indexname = 'idx_projects_heures_reference'
  ) THEN
    CREATE INDEX idx_projects_heures_reference ON projects(heures_reference);
  END IF;
END $$;

-- Ajout de la contrainte de validation si non existante
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'projects' 
    AND constraint_name = 'check_heures_reference_range'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT check_heures_reference_range 
    CHECK (heures_reference >= 0 AND heures_reference <= 24);
  END IF;
END $$;