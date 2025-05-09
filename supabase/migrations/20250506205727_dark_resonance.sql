-- Update the save_invoice function to handle the created_by field properly
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
  v_created_by uuid;
BEGIN
  -- Get current user ID from the request or from the invoice data
  v_user_id := auth.uid();
  v_created_by := COALESCE(
    (p_invoice->>'created_by')::uuid,
    v_user_id,
    (SELECT id FROM auth.users LIMIT 1)
  );
  
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
      v_created_by
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
        v_created_by
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