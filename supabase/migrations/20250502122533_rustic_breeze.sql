/*
  # Tables pour les données extraites des contrats

  1. Nouvelles Tables
    - `contract_extracted_data` - Stocke les métadonnées des extractions
    - `contract_data_rows` - Stocke les lignes de données extraites

  2. Fonctionnalités
    - Extraction de données par section (articles, conditions, conditions spéciales)
    - Lien avec les documents sources
    - Stockage flexible des valeurs en JSON

  3. Sécurité
    - RLS désactivé pour le développement
*/

DO $$ 
BEGIN
  -- Vérifier si la table contract_extracted_data existe déjà
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contract_extracted_data'
  ) THEN
    -- Table pour les données extraites des contrats
    CREATE TABLE contract_extracted_data (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      document_id uuid REFERENCES contract_documents(id) ON DELETE SET NULL,
      section text NOT NULL CHECK (section IN ('articles', 'conditions', 'conditions_speciales')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_by uuid REFERENCES auth.users(id)
    );

    -- Indexes pour les performances
    CREATE INDEX idx_contract_extracted_data_contract ON contract_extracted_data(contract_id);
    CREATE INDEX idx_contract_extracted_data_document ON contract_extracted_data(document_id);
    CREATE INDEX idx_contract_extracted_data_section ON contract_extracted_data(section);

    -- Trigger pour la mise à jour automatique de updated_at
    CREATE TRIGGER set_contract_extracted_data_updated_at
      BEFORE UPDATE ON contract_extracted_data
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();

    -- Désactiver RLS pour le développement
    ALTER TABLE contract_extracted_data DISABLE ROW LEVEL SECURITY;
  END IF;

  -- Vérifier si la table contract_data_rows existe déjà
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contract_data_rows'
  ) THEN
    -- Table pour les lignes de données extraites
    CREATE TABLE contract_data_rows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      extracted_data_id uuid NOT NULL REFERENCES contract_extracted_data(id) ON DELETE CASCADE,
      values jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Indexes pour les performances
    CREATE INDEX idx_contract_data_rows_extracted_data ON contract_data_rows(extracted_data_id);

    -- Trigger pour la mise à jour automatique de updated_at
    CREATE TRIGGER set_contract_data_rows_updated_at
      BEFORE UPDATE ON contract_data_rows
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();

    -- Désactiver RLS pour le développement
    ALTER TABLE contract_data_rows DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;