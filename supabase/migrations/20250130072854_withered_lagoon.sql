/*
  # Ajout de la colonne entreprise au personnel de base

  1. Modifications
    - Ajout de la colonne entreprise à la table base_personnel
    - Mise à jour des données existantes avec la valeur PFSA
    - Création d'un index sur la colonne entreprise
*/

-- Ajout de la colonne entreprise
ALTER TABLE base_personnel
ADD COLUMN entreprise text NOT NULL DEFAULT 'PFSA';

-- Mise à jour des données existantes
UPDATE base_personnel
SET entreprise = 'PFSA'
WHERE entreprise = 'PFSA';

-- Création d'un index
CREATE INDEX idx_base_personnel_entreprise ON base_personnel(entreprise);