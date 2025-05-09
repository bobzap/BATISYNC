/*
  # Fix Database Relationships

  1. Changes
    - Properly add foreign key constraints for invoices table
    - Fix the created_by constraint issue
    - Refresh schema cache for PostgREST
    
  2. Security
    - Ensure proper relationships between tables
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
FOREIGN KEY (validated_by) REFERENCES profiles(id);

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

-- Fix created_by constraint
DO $$ 
BEGIN
  -- First check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_created_by_fkey'
  ) THEN
    ALTER TABLE invoices DROP CONSTRAINT invoices_created_by_fkey;
  END IF;
  
  -- Recreate the constraint properly
  ALTER TABLE invoices
  ADD CONSTRAINT invoices_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id);
END $$;

-- Update any existing NULL created_by values with a default user
DO $$
DECLARE
  default_user_id uuid;
BEGIN
  -- Get a default user ID
  SELECT id INTO default_user_id FROM profiles LIMIT 1;
  
  -- Update invoices with NULL created_by
  IF default_user_id IS NOT NULL THEN
    UPDATE invoices SET created_by = default_user_id WHERE created_by IS NULL;
  END IF;
END $$;

-- Make created_by NOT NULL for future inserts
ALTER TABLE invoices ALTER COLUMN created_by SET NOT NULL;

-- Refresh the schema cache for Supabase
NOTIFY pgrst, 'reload schema';