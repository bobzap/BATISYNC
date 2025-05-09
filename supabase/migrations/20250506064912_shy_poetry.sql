/*
  # Disable RLS on storage bucket for development
  
  1. Changes
    - Disable RLS on storage.objects for the contracts bucket
    - Create permissive policies for development
    
  2. Security
    - This is for development only
    - Should be replaced with proper RLS in production
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create permissive policies for development
CREATE POLICY "Allow all operations for authenticated users"
  ON storage.objects FOR ALL 
  TO authenticated
  USING (bucket_id = 'contracts')
  WITH CHECK (bucket_id = 'contracts');

-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO UPDATE SET public = true;