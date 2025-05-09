/*
  # Configuration de l'authentification par email uniquement
  
  1. Changements
    - Désactive l'authentification par mot de passe
    - Configure l'authentification par email uniquement
*/

-- Désactiver l'authentification par mot de passe
ALTER TABLE auth.users 
ALTER COLUMN encrypted_password DROP NOT NULL;

-- Supprimer les mots de passe existants
UPDATE auth.users
SET encrypted_password = NULL
WHERE encrypted_password IS NOT NULL;

-- Configurer les paramètres d'authentification
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at SET DEFAULT now(),
ALTER COLUMN is_sso_user SET DEFAULT false,
ALTER COLUMN email_change_confirm_status SET DEFAULT 0;

-- Configurer les paramètres de confirmation
UPDATE auth.users
SET 
  email_confirmed_at = now(),
  is_sso_user = false,
  email_change_confirm_status = 0
WHERE email_confirmed_at IS NULL;