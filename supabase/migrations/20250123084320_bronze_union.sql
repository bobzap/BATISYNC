/*
  # Create profiles table and admin user

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - Lié à auth.users
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (enum)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Policies pour lecture/écriture
    - Trigger pour création automatique de profil

  3. Admin User
    - Configuration de l'utilisateur admin par défaut
*/

-- Create role enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'member',
  'viewer'
);

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  role user_role NOT NULL DEFAULT 'member',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'l.daize@proton.me' THEN 'super_admin'::user_role
      ELSE 'member'::user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create index
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update trigger for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();