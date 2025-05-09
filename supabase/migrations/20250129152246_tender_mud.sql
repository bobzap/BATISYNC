/*
  # Ajout de la colonne statut à base_personnel
  
  1. Modifications
    - Ajout de la colonne `statut` à la table `base_personnel`
    - Définition de la valeur par défaut à 'actif'
    - Mise à jour des enregistrements existants
  
  2. Index
    - Création d'un index sur la colonne statut
*/

-- Ajout de la colonne statut si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'base_personnel' AND column_name = 'statut'
  ) THEN
    ALTER TABLE base_personnel 
    ADD COLUMN statut text NOT NULL DEFAULT 'actif';
    
    -- Création de l'index
    CREATE INDEX IF NOT EXISTS idx_base_personnel_statut ON base_personnel(statut);
  END IF;
END $$;