/*
  # Contract Data Extraction Tables

  1. New Tables
    - `contract_extracted_data`: Stores metadata about extracted contract data
    - `contract_data_rows`: Stores the actual extracted data values
    
  2. Changes
    - Add checks to prevent table creation if they already exist
    - Add proper indexes and triggers
    - Disable RLS for development
*/

DO $$ 
BEGIN
  -- Create contract_extracted_data table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contract_extracted_data'
  ) THEN
    CREATE TABLE contract_extracted_data (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      document_id uuid REFERENCES contract_documents(id) ON DELETE SET NULL,
      section text NOT NULL CHECK (section IN ('articles', 'conditions', 'conditions_speciales')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_by uuid REFERENCES auth.users(id)
    );

    -- Create indexes
    CREATE INDEX idx_contract_extracted_data_contract ON contract_extracted_data(contract_id);
    CREATE INDEX idx_contract_extracted_data_document ON contract_extracted_data(document_id);
    CREATE INDEX idx_contract_extracted_data_section ON contract_extracted_data(section);

    -- Create trigger
    CREATE TRIGGER set_contract_extracted_data_updated_at
      BEFORE UPDATE ON contract_extracted_data
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();

    -- Disable RLS
    ALTER TABLE contract_extracted_data DISABLE ROW LEVEL SECURITY;
  END IF;

  -- Create contract_data_rows table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contract_data_rows'
  ) THEN
    CREATE TABLE contract_data_rows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      extracted_data_id uuid NOT NULL REFERENCES contract_extracted_data(id) ON DELETE CASCADE,
      values jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Create index
    CREATE INDEX idx_contract_data_rows_extracted_data ON contract_data_rows(extracted_data_id);

    -- Create trigger
    CREATE TRIGGER set_contract_data_rows_updated_at
      BEFORE UPDATE ON contract_data_rows
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();

    -- Disable RLS
    ALTER TABLE contract_data_rows DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;