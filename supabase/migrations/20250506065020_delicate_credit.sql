/*
  # Disable RLS on storage for development
  
  1. Changes
    - Create contracts bucket if it doesn't exist
    - Disable RLS on storage.objects table
    - Create permissive policy for authenticated users
    
  2. Security
    - WARNING: This is for development only!
    - Should be replaced with proper RLS in production
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