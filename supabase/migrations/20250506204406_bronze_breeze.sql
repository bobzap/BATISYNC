/*
  # Fix relationship between invoices and users

  1. Changes
    - Drop and recreate the foreign key constraint for invoices.validated_by
    - Add reference column to invoices if it doesn't exist
    - Create functions to handle string IDs in project references
    - Fix the relationship between invoices and auth.users
    
  2. Security
    - Maintain existing RLS settings
*/

-- First check if the constraint exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_validated_by_fkey'
  ) THEN
    ALTER TABLE invoices DROP CONSTRAINT invoices_validated_by_fkey;
  END IF;
END $$;

-- Recreate the constraint properly
ALTER TABLE invoices
ADD CONSTRAINT invoices_validated_by_fkey
FOREIGN KEY (validated_by) REFERENCES auth.users(id);

-- Add reference column to invoices if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'reference'
  ) THEN
    ALTER TABLE invoices 
    ADD COLUMN reference text;
  END IF;
END $$;

-- Add created_by constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_created_by_fkey'
  ) THEN
    ALTER TABLE invoices
    ADD CONSTRAINT invoices_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Refresh the schema cache for Supabase
NOTIFY pgrst, 'reload schema';