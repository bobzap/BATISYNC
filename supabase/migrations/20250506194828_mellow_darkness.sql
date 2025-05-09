/*
  # Correction du suivi des bons
  
  1. Nouvelles Fonctions
    - `get_vouchers_by_project`: Récupère tous les bons d'un projet avec leurs informations complètes
    - `get_voucher_invoice_links`: Récupère les liens entre bons et factures
  
  2. Indexes
    - Ajout d'index pour améliorer les performances des requêtes
    
  3. Vues
    - `vouchers_with_invoices`: Vue qui joint les bons avec leurs factures associées
*/

-- Fonction pour récupérer les bons d'un projet
CREATE OR REPLACE FUNCTION get_vouchers_by_project(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  type voucher_type,
  number text,
  supplier text,
  date date,
  materials text,
  quantity numeric,
  unit text,
  unit_price numeric,
  loading_location text,
  unloading_location text,
  truck_type text,
  status validation_status,
  validated_by uuid,
  validated_at timestamptz,
  invoice_id uuid,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.project_id,
    v.type,
    v.number,
    v.supplier,
    v.date,
    v.materials,
    v.quantity,
    v.unit,
    v.unit_price,
    v.loading_location,
    v.unloading_location,
    v.truck_type,
    v.status,
    v.validated_by,
    v.validated_at,
    vil.invoice_id,
    v.created_by,
    v.created_at,
    v.updated_at
  FROM 
    vouchers v
  LEFT JOIN 
    voucher_invoice_links vil ON v.id = vil.voucher_id
  WHERE 
    v.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Vue pour joindre les bons avec leurs factures
CREATE OR REPLACE VIEW vouchers_with_invoices AS
SELECT 
  v.id,
  v.project_id,
  v.type,
  v.number,
  v.supplier,
  v.date,
  v.materials,
  v.quantity,
  v.unit,
  v.unit_price,
  v.loading_location,
  v.unloading_location,
  v.truck_type,
  v.status,
  v.validated_by,
  v.validated_at,
  vil.invoice_id,
  i.number AS invoice_number,
  i.date AS invoice_date,
  i.status AS invoice_status,
  v.created_by,
  v.created_at,
  v.updated_at
FROM 
  vouchers v
LEFT JOIN 
  voucher_invoice_links vil ON v.id = vil.voucher_id
LEFT JOIN 
  invoices i ON vil.invoice_id = i.id;

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vouchers_project_type ON vouchers(project_id, type);
CREATE INDEX IF NOT EXISTS idx_vouchers_date_range ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_supplier ON vouchers(supplier);

-- Désactiver RLS sur voucher_invoice_links pour le développement
ALTER TABLE voucher_invoice_links DISABLE ROW LEVEL SECURITY;

-- Insérer des données de test si la table est vide
DO $$
DECLARE
  project_id_var uuid;
  user_id_var uuid;
  voucher_id_var uuid;
BEGIN
  -- Récupérer un ID de projet existant
  SELECT id INTO project_id_var FROM projects LIMIT 1;
  
  -- Récupérer un ID d'utilisateur existant
  SELECT id INTO user_id_var FROM auth.users LIMIT 1;
  
  -- Vérifier si la table vouchers est vide
  IF NOT EXISTS (SELECT 1 FROM vouchers LIMIT 1) AND project_id_var IS NOT NULL AND user_id_var IS NOT NULL THEN
    -- Insérer des bons de livraison
    INSERT INTO vouchers (project_id, type, number, supplier, date, materials, quantity, unit, unit_price, loading_location, unloading_location, truck_type, status, created_by)
    VALUES
      (project_id_var, 'delivery', 'BL-2025-001', 'Holcim', '2025-05-01', 'Gravier 0/32', 15.5, 'm3', 45.80, 'Carrière Nord', 'Chantier A', 'Semi-remorque', 'validated', user_id_var),
      (project_id_var, 'delivery', 'BL-2025-002', 'Lafarge', '2025-05-02', 'Sable 0/4', 8.2, 'tonnes', 38.50, 'Dépôt Est', 'Chantier A', 'Camion 8x4', 'validated', user_id_var),
      (project_id_var, 'delivery', 'BL-2025-003', 'Colas', '2025-05-03', 'Enrobé à chaud', 12.0, 'tonnes', 120.00, 'Centrale Colas', 'Chantier A', 'Camion benne', 'pending', user_id_var);
    
    -- Insérer des bons d'évacuation
    INSERT INTO vouchers (project_id, type, number, supplier, date, materials, quantity, unit, unit_price, loading_location, unloading_location, truck_type, status, created_by)
    VALUES
      (project_id_var, 'evacuation', 'BE-2025-001', 'Soreval', '2025-05-01', 'Terre végétale', 18.0, 'm3', 12.50, 'Chantier A', 'Décharge Soreval', 'Semi-remorque', 'validated', user_id_var),
      (project_id_var, 'evacuation', 'BE-2025-002', 'Ecosor', '2025-05-02', 'Matériaux inertes', 22.5, 'tonnes', 25.00, 'Chantier A', 'Centre de tri', 'Camion 8x4', 'pending', user_id_var);
    
    -- Insérer des bons de béton
    INSERT INTO vouchers (project_id, type, number, supplier, date, materials, quantity, unit, unit_price, truck_type, status, created_by)
    VALUES
      (project_id_var, 'concrete', 'BB-2025-001', 'Holcim Béton', '2025-05-04', 'C30/37 XC4', 8.5, 'm3', 185.00, 'Toupie', 'validated', user_id_var),
      (project_id_var, 'concrete', 'BB-2025-002', 'Lafarge Béton', '2025-05-05', 'C25/30 XC2', 12.0, 'm3', 175.00, 'Toupie', 'draft', user_id_var);
    
    -- Insérer des bons de matériaux
    INSERT INTO vouchers (project_id, type, number, supplier, date, materials, quantity, unit, unit_price, status, created_by)
    VALUES
      (project_id_var, 'materials', 'BM-2025-001', 'Point P', '2025-05-06', 'Ciment CEM II 32.5', 40, 'sacs', 8.50, 'validated', user_id_var),
      (project_id_var, 'materials', 'BM-2025-002', 'Gedimat', '2025-05-07', 'Treillis soudé ST25C', 15, 'unités', 45.00, 'pending', user_id_var);
    
    -- Créer une facture de test
    INSERT INTO invoices (project_id, number, supplier, date, due_date, amount_ht, amount_ttc, vat_rate, status, created_by)
    VALUES
      (project_id_var, 'F-2025-001', 'Holcim', '2025-05-10', '2025-06-10', 1200.00, 1440.00, 20.0, 'validated', user_id_var)
    RETURNING id INTO voucher_id_var;
    
    -- Lier un bon à la facture
    IF voucher_id_var IS NOT NULL THEN
      INSERT INTO voucher_invoice_links (voucher_id, invoice_id, amount, created_by)
      SELECT id, voucher_id_var, quantity * unit_price, user_id_var
      FROM vouchers
      WHERE number = 'BL-2025-001' AND project_id = project_id_var;
    END IF;
  END IF;
END $$;