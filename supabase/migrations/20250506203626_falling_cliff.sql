-- Check if the constraint already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_validated_by_fkey') THEN
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_validated_by_fkey
        FOREIGN KEY (validated_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Add reference column to invoices if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'reference'
  ) THEN
    ALTER TABLE invoices 
    ADD COLUMN reference text;
  END IF;
END $$;

-- Update the get_extracted_vouchers_by_project function to handle string IDs
CREATE OR REPLACE FUNCTION get_extracted_vouchers_by_project(
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

-- Update the get_vouchers_with_invoices function to handle string IDs
CREATE OR REPLACE FUNCTION get_vouchers_with_invoices(
  p_project_id text,
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
    v.project_id = v_project_uuid
    AND (p_start_date IS NULL OR v.date >= p_start_date)
    AND (p_end_date IS NULL OR v.date <= p_end_date)
  ORDER BY 
    v.date DESC, v.number;
END;
$$ LANGUAGE plpgsql;

-- Update the get_invoices_by_project function to handle string IDs
CREATE OR REPLACE FUNCTION get_invoices_by_project(
  p_project_id text,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_supplier text DEFAULT NULL,
  p_is_paid boolean DEFAULT NULL,
  p_is_overdue boolean DEFAULT NULL
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
  documents json,
  vouchers json
) AS $$
DECLARE
  v_project_uuid uuid;
  v_today date := CURRENT_DATE;
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
  WITH invoice_documents AS (
    SELECT 
      invoice_id,
      json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'type', type,
          'url', url,
          'date', date_upload,
          'size', NULL
        )
      ) AS docs
    FROM 
      invoice_documents
    GROUP BY 
      invoice_id
  ),
  invoice_vouchers AS (
    SELECT 
      vil.invoice_id,
      json_agg(
        json_build_object(
          'id', v.id,
          'type', v.type,
          'number', v.number,
          'supplier', v.supplier,
          'date', v.date,
          'materials', v.materials,
          'quantity', v.quantity,
          'unit', v.unit,
          'unitPrice', v.unit_price,
          'amount', vil.amount
        )
      ) AS vouchers
    FROM 
      voucher_invoice_links vil
    JOIN 
      extracted_vouchers v ON vil.voucher_id = v.id
    GROUP BY 
      vil.invoice_id
  )
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
    COALESCE(id.docs, '[]'::json) AS documents,
    COALESCE(iv.vouchers, '[]'::json) AS vouchers
  FROM 
    invoices i
  LEFT JOIN 
    invoice_documents id ON i.id = id.invoice_id
  LEFT JOIN 
    invoice_vouchers iv ON i.id = iv.invoice_id
  WHERE 
    i.project_id = v_project_uuid
    AND (p_start_date IS NULL OR i.date >= p_start_date)
    AND (p_end_date IS NULL OR i.date <= p_end_date)
    AND (p_status IS NULL OR p_status = '' OR i.status::text = p_status)
    AND (p_supplier IS NULL OR p_supplier = '' OR i.supplier ILIKE '%' || p_supplier || '%')
    AND (p_is_paid IS NULL OR (p_is_paid = true AND i.payment_date IS NOT NULL) OR (p_is_paid = false AND i.payment_date IS NULL))
    AND (p_is_overdue IS NULL OR (p_is_overdue = true AND i.payment_date IS NULL AND i.due_date < v_today) OR (p_is_overdue = false AND (i.payment_date IS NOT NULL OR i.due_date >= v_today)))
  ORDER BY 
    i.date DESC, i.number;
END;
$$ LANGUAGE plpgsql;

-- Create the saveInvoice function
CREATE OR REPLACE FUNCTION save_invoice(
  p_project_id text,
  p_invoice jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_project_uuid uuid;
  v_invoice_id uuid;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    v_user_id := (SELECT id FROM auth.users LIMIT 1);
  END IF;

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

  -- Check if this is an update or insert
  IF p_invoice->>'id' IS NOT NULL THEN
    -- Update existing invoice
    UPDATE invoices
    SET
      number = p_invoice->>'number',
      reference = p_invoice->>'reference',
      supplier = p_invoice->>'supplier',
      date = (p_invoice->>'date')::date,
      due_date = (p_invoice->>'dueDate')::date,
      amount_ht = (p_invoice->>'amountHT')::numeric,
      amount_ttc = (p_invoice->>'amountTTC')::numeric,
      vat_rate = (p_invoice->>'vatRate')::numeric,
      status = (p_invoice->>'status')::validation_status,
      payment_date = NULLIF(p_invoice->>'paymentDate', '')::date,
      payment_reference = NULLIF(p_invoice->>'paymentReference', ''),
      updated_at = now()
    WHERE id = (p_invoice->>'id')::uuid
    RETURNING id INTO v_invoice_id;
  ELSE
    -- Insert new invoice
    INSERT INTO invoices (
      project_id,
      number,
      reference,
      supplier,
      date,
      due_date,
      amount_ht,
      amount_ttc,
      vat_rate,
      status,
      payment_date,
      payment_reference,
      created_by
    ) VALUES (
      v_project_uuid,
      p_invoice->>'number',
      p_invoice->>'reference',
      p_invoice->>'supplier',
      (p_invoice->>'date')::date,
      (p_invoice->>'dueDate')::date,
      (p_invoice->>'amountHT')::numeric,
      (p_invoice->>'amountTTC')::numeric,
      (p_invoice->>'vatRate')::numeric,
      (p_invoice->>'status')::validation_status,
      NULLIF(p_invoice->>'paymentDate', '')::date,
      NULLIF(p_invoice->>'paymentReference', ''),
      v_user_id
    )
    RETURNING id INTO v_invoice_id;
  END IF;

  -- Handle voucher links if present
  IF jsonb_array_length(p_invoice->'vouchers') > 0 THEN
    -- Delete existing links
    DELETE FROM voucher_invoice_links WHERE invoice_id = v_invoice_id;
    
    -- Add new links
    FOR i IN 0..jsonb_array_length(p_invoice->'vouchers')-1 LOOP
      INSERT INTO voucher_invoice_links (
        voucher_id,
        invoice_id,
        amount,
        created_by
      ) VALUES (
        (p_invoice->'vouchers'->i->>'id')::uuid,
        v_invoice_id,
        COALESCE((p_invoice->'vouchers'->i->>'amount')::numeric, 0),
        v_user_id
      );
    END LOOP;
  END IF;

  -- Return the complete invoice data
  SELECT 
    jsonb_build_object(
      'id', i.id,
      'projectId', i.project_id,
      'number', i.number,
      'reference', i.reference,
      'supplier', i.supplier,
      'date', i.date,
      'dueDate', i.due_date,
      'amountHT', i.amount_ht,
      'amountTTC', i.amount_ttc,
      'vatRate', i.vat_rate,
      'status', i.status,
      'paymentDate', i.payment_date,
      'paymentReference', i.payment_reference,
      'validatedBy', i.validated_by,
      'validatedAt', i.validated_at,
      'createdBy', i.created_by,
      'createdAt', i.created_at,
      'updatedAt', i.updated_at,
      'documents', COALESCE(id.docs, '[]'::json),
      'vouchers', COALESCE(iv.vouchers, '[]'::json)
    ) INTO v_result
  FROM 
    invoices i
  LEFT JOIN (
    SELECT 
      invoice_id,
      json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'type', type,
          'url', url,
          'date', date_upload,
          'size', NULL
        )
      ) AS docs
    FROM 
      invoice_documents
    WHERE
      invoice_id = v_invoice_id
    GROUP BY 
      invoice_id
  ) id ON i.id = id.invoice_id
  LEFT JOIN (
    SELECT 
      vil.invoice_id,
      json_agg(
        json_build_object(
          'id', v.id,
          'type', v.type,
          'number', v.number,
          'supplier', v.supplier,
          'date', v.date,
          'materials', v.materials,
          'quantity', v.quantity,
          'unit', v.unit,
          'unitPrice', v.unit_price,
          'amount', vil.amount
        )
      ) AS vouchers
    FROM 
      voucher_invoice_links vil
    JOIN 
      extracted_vouchers v ON vil.voucher_id = v.id
    WHERE
      vil.invoice_id = v_invoice_id
    GROUP BY 
      vil.invoice_id
  ) iv ON i.id = iv.invoice_id
  WHERE 
    i.id = v_invoice_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create the deleteInvoice function
CREATE OR REPLACE FUNCTION delete_invoice(p_invoice_id text)
RETURNS boolean AS $$
DECLARE
  v_invoice_uuid uuid;
BEGIN
  -- Convert string ID to UUID if needed
  BEGIN
    v_invoice_uuid := p_invoice_id::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid invoice ID: %', p_invoice_id;
  END;

  -- Delete the invoice
  DELETE FROM invoices WHERE id = v_invoice_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;