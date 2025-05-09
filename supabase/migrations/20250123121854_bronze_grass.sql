-- Drop existing policies
DROP POLICY IF EXISTS "Users can view personnel for their projects" ON personnel;
DROP POLICY IF EXISTS "Users can insert personnel in their projects" ON personnel;
DROP POLICY IF EXISTS "Users can update personnel in their projects" ON personnel;
DROP POLICY IF EXISTS "Users can delete personnel in their projects" ON personnel;

-- Create temporary permissive policies for development
CREATE POLICY "Allow all operations for authenticated users"
  ON personnel FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;