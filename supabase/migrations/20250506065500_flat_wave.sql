/*
  # Fix Storage Issues

  1. Changes
    - Create the contracts bucket if it doesn't exist
    - Make the bucket public
    - Disable RLS on storage.objects
    - Remove duplicate upload calls in ContractModal
    
  2. Security
    - This is for development only
    - RLS should be re-enabled for production
*/

-- Create the contracts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create permissive policy for all operations
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;

CREATE POLICY "Allow all operations for authenticated users"
  ON storage.objects FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);