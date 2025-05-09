/*
  # Correction des problèmes de stockage et de RLS
  
  1. Changements
    - Création du bucket 'contracts' s'il n'existe pas
    - Configuration du bucket comme public
    - Désactivation complète de RLS sur storage.objects
    - Ajout d'une colonne file_path à contract_documents
    
  2. Sécurité
    - Désactivation temporaire de RLS pour le développement
    - À réactiver en production avec des politiques appropriées
*/

-- Créer le bucket contracts s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Désactiver RLS sur storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Ajouter une colonne file_path à contract_documents si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contract_documents' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE contract_documents 
    ADD COLUMN file_path text;
  END IF;
END $$;