/*
  # Mise à jour des heures de référence

  1. Modifications
    - Ajout de la contrainte de validation pour les heures
    - Mise à jour des valeurs existantes
*/

-- Ajout de la contrainte de validation
ALTER TABLE projects
ADD CONSTRAINT check_heures_reference 
CHECK (heures_reference >= 0 AND heures_reference <= 24);

-- Mise à jour des valeurs existantes à 7.5h par défaut
UPDATE projects 
SET heures_reference = 7.5 
WHERE heures_reference IS NULL;