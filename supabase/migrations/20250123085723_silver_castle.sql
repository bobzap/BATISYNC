/*
  # Add super admin account

  1. Create super admin user
    - Email: l.daize@proton.me
    - Role: super_admin
    - First name: Louis
    - Last name: Daize
    
  2. Security
    - Account is pre-configured with super admin role
*/

-- Create the auth user if it doesn't exist
INSERT INTO auth.users (
  id,
  email,
  role,
  instance_id,
  email_confirmed_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'l.daize@proton.me',
  'authenticated',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'l.daize@proton.me'
);

-- Update or create the profile
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Louis',
  'Daize',
  'super_admin'::user_role,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'l.daize@proton.me'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin'::user_role,
  first_name = 'Louis',
  last_name = 'Daize',
  updated_at = now();