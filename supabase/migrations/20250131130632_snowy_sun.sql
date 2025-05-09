/*
  # Ajout des colonnes pour le personnel externe
  
  1. Nouvelles Colonnes
    - `nom` (text) - Nom du personnel externe
    - `prenom` (text) - Prénom du personnel externe
    - `intitule_fonction` (text) - Fonction du personnel externe
    - `entreprise` (text) - Entreprise du personnel externe
  
  2. Modifications
    - Rend `personnel_id` nullable pour permettre le personnel externe
    - Ajoute une contrainte pour s'assurer qu'au moins personnel_id OU (nom, prenom) sont remplis
*/

-- Ajout des colonnes pour le personnel externe
ALTER TABLE project_personnel
ADD COLUMN nom text,
ADD COLUMN prenom text,
ADD COLUMN intitule_fonction text,
ADD COLUMN entreprise text;

-- Rendre personnel_id nullable
ALTER TABLE project_personnel
ALTER COLUMN personnel_id DROP NOT NULL;

-- Ajouter une contrainte pour s'assurer qu'au moins une identification est présente
ALTER TABLE project_personnel
ADD CONSTRAINT check_personnel_identification
CHECK (
  (personnel_id IS NOT NULL) OR 
  (nom IS NOT NULL AND prenom IS NOT NULL AND intitule_fonction IS NOT NULL AND entreprise IS NOT NULL)
);

-- Créer des index pour améliorer les performances
CREATE INDEX idx_project_personnel_nom ON project_personnel(nom);
CREATE INDEX idx_project_personnel_entreprise ON project_personnel(entreprise);
CREATE INDEX idx_project_personnel_fonction ON project_personnel(intitule_fonction);