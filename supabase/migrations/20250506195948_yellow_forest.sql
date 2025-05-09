/*
  # Update Vouchers View and Functions
  
  1. Changes
    - Improve the extracted_vouchers view to handle all voucher types
    - Add unit_price extraction from daily reports
    - Create a function to get vouchers with invoice information
    - Add proper filtering capabilities
    
  2. Features
    - Extract all voucher types from daily reports
    - Support filtering by date range, type, status, and supplier
    - Calculate totals for reporting
*/

-- Drop existing view and function if they exist
DROP VIEW IF EXISTS extracted_vouchers CASCADE;
DROP FUNCTION IF EXISTS get_extracted_vouchers_by_project CASCADE;

-- Create an improved view to extract vouchers from daily reports
CREATE OR REPLACE VIEW extracted_vouchers AS
WITH 
  apport AS (
    SELECT
      dr.id AS report_id,
      dr.project_id,
      'delivery'::voucher_type AS type,
      jsonb_array_elements(dr.bons_apport)->>'numeroBon' AS number,
      jsonb_array_elements(dr.bons_apport)->>'fournisseur' AS supplier,
      dr.date,
      jsonb_array_elements(dr.bons_apport)->>'materiaux' AS materials,
      (jsonb_array_elements(dr.bons_apport)->>'quantite')::numeric AS quantity,
      jsonb_array_elements(dr.bons_apport)->>'unite' AS unit,
      NULLIF(jsonb_array_elements(dr.bons_apport)->>'prixUnitaire', '')::numeric AS unit_price,
      jsonb_array_elements(dr.bons_apport)->>'lieuChargement' AS loading_location,
      jsonb_array_elements(dr.bons_apport)->>'lieuDechargement' AS unloading_location,
      jsonb_array_elements(dr.bons_apport)->>'typeCamion' AS truck_type,
      CASE 
        WHEN dr.visa_contremaitre THEN 'validated'::validation_status
        ELSE 'pending'::validation_status
      END AS status,
      dr.visa_user_id AS validated_by,
      dr.visa_date AS validated_at,
      dr.created_by,
      dr.created_at,
      dr.updated_at
    FROM daily_reports dr
    WHERE jsonb_array_length(dr.bons_apport) > 0
  ),
  evacuation AS (
    SELECT
      dr.id AS report_id,
      dr.project_id,
      'evacuation'::voucher_type AS type,
      jsonb_array_elements(dr.bons_evacuation)->>'numeroBon' AS number,
      jsonb_array_elements(dr.bons_evacuation)->>'fournisseur' AS supplier,
      dr.date,
      jsonb_array_elements(dr.bons_evacuation)->>'materiaux' AS materials,
      (jsonb_array_elements(dr.bons_evacuation)->>'quantite')::numeric AS quantity,
      jsonb_array_elements(dr.bons_evacuation)->>'unite' AS unit,
      NULLIF(jsonb_array_elements(dr.bons_evacuation)->>'prixUnitaire', '')::numeric AS unit_price,
      jsonb_array_elements(dr.bons_evacuation)->>'lieuChargement' AS loading_location,
      jsonb_array_elements(dr.bons_evacuation)->>'lieuDechargement' AS unloading_location,
      jsonb_array_elements(dr.bons_evacuation)->>'typeCamion' AS truck_type,
      CASE 
        WHEN dr.visa_contremaitre THEN 'validated'::validation_status
        ELSE 'pending'::validation_status
      END AS status,
      dr.visa_user_id AS validated_by,
      dr.visa_date AS validated_at,
      dr.created_by,
      dr.created_at,
      dr.updated_at
    FROM daily_reports dr
    WHERE jsonb_array_length(dr.bons_evacuation) > 0
  ),
  beton AS (
    SELECT
      dr.id AS report_id,
      dr.project_id,
      'concrete'::voucher_type AS type,
      jsonb_array_elements(dr.bons_beton)->>'numeroBon' AS number,
      jsonb_array_elements(dr.bons_beton)->>'fournisseur' AS supplier,
      dr.date,
      jsonb_array_elements(dr.bons_beton)->>'articles' AS materials,
      (jsonb_array_elements(dr.bons_beton)->>'quantite')::numeric AS quantity,
      jsonb_array_elements(dr.bons_beton)->>'unite' AS unit,
      NULLIF(jsonb_array_elements(dr.bons_beton)->>'prixUnitaire', '')::numeric AS unit_price,
      NULL AS loading_location,
      NULL AS unloading_location,
      jsonb_array_elements(dr.bons_beton)->>'typeCamion' AS truck_type,
      CASE 
        WHEN dr.visa_contremaitre THEN 'validated'::validation_status
        ELSE 'pending'::validation_status
      END AS status,
      dr.visa_user_id AS validated_by,
      dr.visa_date AS validated_at,
      dr.created_by,
      dr.created_at,
      dr.updated_at
    FROM daily_reports dr
    WHERE jsonb_array_length(dr.bons_beton) > 0
  ),
  materiaux AS (
    SELECT
      dr.id AS report_id,
      dr.project_id,
      'materials'::voucher_type AS type,
      jsonb_array_elements(dr.bons_materiaux)->>'numeroBon' AS number,
      jsonb_array_elements(dr.bons_materiaux)->>'fournisseur' AS supplier,
      dr.date,
      jsonb_array_elements(dr.bons_materiaux)->>'fournitures' AS materials,
      (jsonb_array_elements(dr.bons_materiaux)->>'quantite')::numeric AS quantity,
      jsonb_array_elements(dr.bons_materiaux)->>'unite' AS unit,
      NULLIF(jsonb_array_elements(dr.bons_materiaux)->>'prixUnitaire', '')::numeric AS unit_price,
      NULL AS loading_location,
      NULL AS unloading_location,
      NULL AS truck_type,
      CASE 
        WHEN dr.visa_contremaitre THEN 'validated'::validation_status
        ELSE 'pending'::validation_status
      END AS status,
      dr.visa_user_id AS validated_by,
      dr.visa_date AS validated_at,
      dr.created_by,
      dr.created_at,
      dr.updated_at
    FROM daily_reports dr
    WHERE jsonb_array_length(dr.bons_materiaux) > 0
  )
SELECT 
  md5(project_id::text || type::text || number::text || date::text)::uuid AS id,
  *
FROM (
  SELECT * FROM apport
  UNION ALL
  SELECT * FROM evacuation
  UNION ALL
  SELECT * FROM beton
  UNION ALL
  SELECT * FROM materiaux
) AS combined_vouchers;

-- Create an improved function to get vouchers by project with filtering
CREATE OR REPLACE FUNCTION get_extracted_vouchers_by_project(
  p_project_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_type text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_supplier text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  report_id uuid,
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
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.report_id,
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
    v.created_by,
    v.created_at,
    v.updated_at
  FROM 
    extracted_vouchers v
  WHERE 
    v.project_id = p_project_id
    AND (p_start_date IS NULL OR v.date >= p_start_date)
    AND (p_end_date IS NULL OR v.date <= p_end_date)
    AND (p_type IS NULL OR p_type = '' OR v.type::text = p_type)
    AND (p_status IS NULL OR p_status = '' OR v.status::text = p_status)
    AND (p_supplier IS NULL OR p_supplier = '' OR v.supplier ILIKE '%' || p_supplier || '%')
  ORDER BY 
    v.date DESC, v.number;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get vouchers with invoice information
CREATE OR REPLACE FUNCTION get_vouchers_with_invoices(
  p_project_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
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
  amount numeric,
  status validation_status,
  invoice_id uuid,
  invoice_number text,
  invoice_date date,
  invoice_status validation_status
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
    COALESCE(v.quantity * v.unit_price, 0) AS amount,
    v.status,
    i.id AS invoice_id,
    i.number AS invoice_number,
    i.date AS invoice_date,
    i.status AS invoice_status
  FROM 
    extracted_vouchers v
  LEFT JOIN 
    invoices i ON v.supplier = i.supplier AND v.date <= i.date
  WHERE 
    v.project_id = p_project_id
    AND (p_start_date IS NULL OR v.date >= p_start_date)
    AND (p_end_date IS NULL OR v.date <= p_end_date)
  ORDER BY 
    v.date DESC, v.number;
END;
$$ LANGUAGE plpgsql;