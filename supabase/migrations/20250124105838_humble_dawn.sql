/*
  # Add nom_chantier column to daily_reports

  1. Changes
    - Add nom_chantier column to daily_reports table
    - Make it non-nullable with empty string default
*/

-- Add nom_chantier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_reports' AND column_name = 'nom_chantier'
  ) THEN
    ALTER TABLE daily_reports 
    ADD COLUMN nom_chantier text NOT NULL DEFAULT '';
  END IF;
END $$;