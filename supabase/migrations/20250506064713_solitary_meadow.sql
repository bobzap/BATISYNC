/*
  # Create storage bucket for contracts

  1. New Storage Bucket
    - Create 'contracts' bucket for storing contract documents
    - Enable public access for authenticated users
    - Set up RLS policies for secure access

  2. Security
    - Enable RLS on bucket
    - Add policies for:
      - Insert: Only authenticated users can upload
      - Select: Authenticated users can view files
      - Update: Only file owners can update
      - Delete: Only file owners can delete
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false);

-- Set up RLS policies
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'contracts' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contracts' AND auth.uid() = owner);