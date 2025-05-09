-- Migration pour garantir la cohérence entre les fonctions de personnel et les rôles

-- Fonction pour vérifier et convertir les intitulés de fonction en codes
CREATE OR REPLACE FUNCTION find_fonction_code(fonction_value TEXT) RETURNS TEXT AS $$
DECLARE
    code_value TEXT;
BEGIN
    -- Vérifier si la valeur existe comme code
    SELECT code INTO code_value FROM personnel_fonctions WHERE code = fonction_value LIMIT 1;
    
    -- Si trouvé, retourner le code
    IF code_value IS NOT NULL THEN
        RETURN code_value;
    END IF;
    
    -- Sinon, vérifier si la valeur existe comme libellé
    SELECT code INTO code_value FROM personnel_fonctions WHERE libelle = fonction_value LIMIT 1;
    
    -- Si trouvé, retourner le code correspondant
    IF code_value IS NOT NULL THEN
        RETURN code_value;
    END IF;
    
    -- Si toujours pas trouvé, retourner la valeur originale (pour compatibilité)
    RETURN fonction_value;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider/corriger l'intitulé de fonction avant insertion
CREATE OR REPLACE FUNCTION check_fonction_exists() RETURNS TRIGGER AS $$
BEGIN
    -- Essayer de trouver le code de fonction correspondant
    NEW.intitule_fonction := find_fonction_code(NEW.intitule_fonction);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à la table project_personnel
DROP TRIGGER IF EXISTS check_fonction_before_insert ON project_personnel;
CREATE TRIGGER check_fonction_before_insert
BEFORE INSERT OR UPDATE ON project_personnel
FOR EACH ROW
EXECUTE FUNCTION check_fonction_exists();

-- Correction des données existantes
UPDATE project_personnel
SET intitule_fonction = find_fonction_code(intitule_fonction)
WHERE intitule_fonction IS NOT NULL;

-- Ajout de la fonction "Maçon" si elle n'existe pas déjà
INSERT INTO personnel_fonctions (code, libelle, couleur_claire, couleur_sombre, ordre, actif)
SELECT 'macon', 'Maçon', 'bg-gray-100 text-gray-800', 'bg-gray-500/20 text-gray-300', 
       (SELECT COALESCE(MAX(ordre), 0) + 1 FROM personnel_fonctions), true
WHERE NOT EXISTS (
    SELECT 1 FROM personnel_fonctions WHERE libelle = 'Maçon'
);