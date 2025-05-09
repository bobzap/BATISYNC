/*
  # Mise à jour de la table personnel pour utiliser personnel_fonctions

  1. Modifications
    - Ajout d'une contrainte de clé étrangère sur la colonne role
    - Mise à jour des données existantes

  2. Sécurité
    - Maintien des policies existantes
*/

-- Mise à jour des données existantes pour correspondre aux nouveaux codes
UPDATE personnel
SET role = CASE
  WHEN role = 'chef_chantier' THEN 'contremaitre'
  WHEN role = 'conducteur' THEN 'machiniste'
  WHEN role = 'ouvrier' THEN 'macon'
  WHEN role = 'technicien' THEN 'chef_equipe'
  WHEN role = 'geometre' THEN 'chef_equipe'
  ELSE 'manoeuvre'
END;

-- Ajout de la contrainte de clé étrangère
ALTER TABLE personnel
ADD CONSTRAINT fk_personnel_fonction
FOREIGN KEY (role)
REFERENCES personnel_fonctions(code)
ON UPDATE CASCADE;