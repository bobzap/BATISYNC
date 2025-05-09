/*
  # Create invoice tables and functions
  
  1. New Tables
    - `invoice_documents` - Stores documents related to invoices
    
  2. New Storage Bucket
    - Create 'invoices' bucket for storing invoice documents
    
  3. Functions
    - Add functions to manage invoice-voucher relationships
    
  4. Security
    - Disable RLS for development
*/

-- Create storage bucket for invoices if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create invoice_documents table
CREATE TABLE IF NOT EXISTS invoice_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  date_upload timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  file_path text
);

-- Create indexes for invoice_documents
CREATE INDEX IF NOT EXISTS idx_invoice_documents_invoice ON invoice_documents(invoice_id);

-- Disable RLS for invoice_documents
ALTER TABLE invoice_documents DISABLE ROW LEVEL SECURITY;

-- Create function to get invoices with vouchers
CREATE OR REPLACE FUNCTION get_invoices_with_vouchers(
  p_project_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  number text,
  reference text,
  supplier text,
  date date,
  due_date date,
  amount_ht numeric,
  amount_ttc numeric,
  vat_rate numeric,
  status validation_status,
  payment_date date,
  payment_reference text,
  validated_by uuid,
  validated_at timestamptz,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  voucher_count bigint,
  voucher_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.project_id,
    i.number,
    i.reference,
    i.supplier,
    i.date,
    i.due_date,
    i.amount_ht,
    i.amount_ttc,
    i.vat_rate,
    i.status,
    i.payment_date,
    i.payment_reference,
    i.validated_by,
    i.validated_at,
    i.created_by,
    i.created_at,
    i.updated_at,
    COUNT(vil.voucher_id) AS voucher_count,
    COALESCE(SUM(vil.amount), 0) AS voucher_amount
  FROM 
    invoices i
  LEFT JOIN 
    voucher_invoice_links vil ON i.id = vil.invoice_id
  WHERE 
    i.project_id = p_project_id
    AND (p_start_date IS NULL OR i.date >= p_start_date)
    AND (p_end_date IS NULL OR i.date <= p_end_date)
  GROUP BY
    i.id
  ORDER BY 
    i.date DESC, i.number;
END;
$$ LANGUAGE plpgsql;

-- Create function to link vouchers to an invoice
CREATE OR REPLACE FUNCTION link_vouchers_to_invoice(
  p_invoice_id uuid,
  p_voucher_ids uuid[],
  p_created_by uuid
)
RETURNS void AS $$
DECLARE
  v_voucher_id uuid;
  v_amount numeric;
BEGIN
  -- Delete existing links
  DELETE FROM voucher_invoice_links WHERE invoice_id = p_invoice_id;
  
  -- Add new links
  FOREACH v_voucher_id IN ARRAY p_voucher_ids
  LOOP
    -- Get voucher details from extracted_vouchers view
    SELECT 
      COALESCE(quantity * unit_price, 0) INTO v_amount
    FROM 
      extracted_vouchers
    WHERE 
      id = v_voucher_id;
    
    -- Insert link
    INSERT INTO voucher_invoice_links (
      voucher_id,
      invoice_id,
      amount,
      created_by
    ) VALUES (
      v_voucher_id,
      p_invoice_id,
      v_amount,
      p_created_by
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;