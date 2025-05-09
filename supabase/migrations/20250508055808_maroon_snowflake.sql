/*
  # Fix personnel role foreign key constraint
  
  1. Changes
    - Update the personnel table to use the correct role codes from personnel_fonctions
    - Add missing roles to personnel_fonctions if needed
    
  2. Security
    - Maintain existing RLS settings
*/

-- First, check if we need to add any missing roles to personnel_fonctions
DO $$ 
BEGIN
  -- Add 'chef_chantier' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM personnel_fonctions WHERE code = 'chef_chantier') THEN
    INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre)
    VALUES ('chef_chantier', 'Chef de chantier', 'bg-red-100 text-red-800', 'bg-red-500/20 text-red-300', 10);
  END IF;
  
  -- Add 'ouvrier' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM personnel_fonctions WHERE code = 'ouvrier') THEN
    INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre)
    VALUES ('ouvrier', 'Ouvrier qualifié', 'bg-indigo-100 text-indigo-800', 'bg-indigo-500/20 text-indigo-300', 11);
  END IF;
  
  -- Add 'conducteur' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM personnel_fonctions WHERE code = 'conducteur') THEN
    INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre)
    VALUES ('conducteur', 'Conducteur d''engins', 'bg-yellow-100 text-yellow-800', 'bg-yellow-500/20 text-yellow-300', 12);
  END IF;
  
  -- Add 'technicien' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM personnel_fonctions WHERE code = 'technicien') THEN
    INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre)
    VALUES ('technicien', 'Technicien', 'bg-teal-100 text-teal-800', 'bg-teal-500/20 text-teal-300', 13);
  END IF;
  
  -- Add 'geometre' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM personnel_fonctions WHERE code = 'geometre') THEN
    INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre)
    VALUES ('geometre', 'Géomètre', 'bg-cyan-100 text-cyan-800', 'bg-cyan-500/20 text-cyan-300', 14);
  END IF;
  
  -- Add 'Maçon' if it doesn't exist (note: this is for the specific error in the log)
  IF NOT EXISTS (SELECT 1 FROM personnel_fonctions WHERE code = 'macon' OR libelle = 'Maçon') THEN
    INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre)
    VALUES ('macon', 'Maçon', 'bg-pink-100 text-pink-800', 'bg-pink-500/20 text-pink-300', 15);
  END IF;
END $$;

-- Update any existing personnel records with invalid roles
UPDATE personnel
SET role = 'macon'
WHERE role = 'Maçon';

UPDATE personnel
SET role = CASE
  WHEN role NOT IN (SELECT code FROM personnel_fonctions) THEN
    CASE 
      WHEN role = 'chef_chantier' THEN 'contremaitre'
      WHEN role = 'ouvrier' THEN 'macon'
      WHEN role = 'conducteur' THEN 'machiniste'
      WHEN role = 'technicien' THEN 'chef_equipe'
      WHEN role = 'geometre' THEN 'chef_equipe'
      ELSE 'manoeuvre'
    END
  ELSE role
END
WHERE role NOT IN (SELECT code FROM personnel_fonctions);