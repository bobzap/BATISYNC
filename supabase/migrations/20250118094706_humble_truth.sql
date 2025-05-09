/*
  # Create personnel table

  1. New Tables
    - `personnel`
      - `id` (uuid, primary key)
      - `nom` (text, not null)
      - `matricule` (text)
      - `role` (text, not null)
      - `equipe` (text)
      - `heures_presence` (numeric, default 7.5)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `personnel` table
    - Add policies for authenticated users to:
      - Read all personnel records
      - Insert their own records
      - Update their own records
*/

CREATE TABLE personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  matricule text,
  role text NOT NULL,
  equipe text,
  heures_presence numeric DEFAULT 7.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Personnel is viewable by everyone"
  ON personnel
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own personnel"
  ON personnel
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own personnel"
  ON personnel
  FOR UPDATE
  USING (true);

-- Function to automatically set updated_at on update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();