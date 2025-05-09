/*
  # Ajout des heures de référence au projet

  1. Modifications
    - Ajout de la colonne heures_reference à la table projects
    - Valeur par défaut à 7.5 heures
    - Contrainte de validation pour les heures entre 0 et 24

  2. Notes
    - Cette modification n'affecte pas les rapports existants
    - La valeur par défaut assure la compatibilité avec les projets existants
*/

-- Ajout de la colonne heures_reference
ALTER TABLE projects
ADD COLUMN heures_reference numeric NOT NULL DEFAULT 7.5
CHECK (heures_reference >= 0 AND heures_reference <= 24);

-- Création d'un index pour les performances
CREATE INDEX idx_projects_heures_reference ON projects(heures_reference);