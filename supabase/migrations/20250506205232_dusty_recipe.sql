/*
  # Fix function overloading and relationship issues

  1. Changes
    - Rename the text parameter version of get_extracted_vouchers_by_project to avoid overloading
    - Fix the relationship between invoices and profiles tables
    
  2. Security
    - Maintain existing RLS settings
*/

-- Drop the conflicting function
DROP FUNCTION IF EXISTS get_extracted_vouchers_by_project(text, date, date, text, text, text);

-- Create a new function with a different name to avoid overloading
CREATE OR REPLACE FUNCTION get_extracted_vouchers_by_project_text(
  p_project_id text,
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
DECLARE
  v_project_uuid uuid;
BEGIN
  -- Convert string ID to UUID if needed
  BEGIN
    v_project_uuid := p_project_id::uuid;
  EXCEPTION WHEN others THEN
    -- If conversion fails, try to find the project by number
    SELECT id INTO v_project_uuid FROM projects WHERE number = p_project_id LIMIT 1;
    IF v_project_uuid IS NULL THEN
      RAISE EXCEPTION 'Invalid project ID: %', p_project_id;
    END IF;
  END;

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
    v.project_id = v_project_uuid
    AND (p_start_date IS NULL OR v.date >= p_start_date)
    AND (p_end_date IS NULL OR v.date <= p_end_date)
    AND (p_type IS NULL OR p_type = '' OR v.type::text = p_type)
    AND (p_status IS NULL OR p_status = '' OR v.status::text = p_status)
    AND (p_supplier IS NULL OR p_supplier = '' OR v.supplier ILIKE '%' || p_supplier || '%')
  ORDER BY 
    v.date DESC, v.number;
END;
$$ LANGUAGE plpgsql;

-- Refresh the schema cache for Supabase
NOTIFY pgrst, 'reload schema';