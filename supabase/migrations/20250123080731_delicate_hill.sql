/*
  # Add vouchers, invoices and costs tracking

  1. New Tables
    - `vouchers`: Stores all types of vouchers (delivery, evacuation, concrete, materials)
    - `invoices`: Stores invoice information
    - `voucher_invoice_links`: Links vouchers to invoices
    - `cost_categories`: Defines cost categories hierarchy
    - `cost_entries`: Records individual cost entries
    - `cost_budgets`: Stores budget information per category

  2. Enums
    - `voucher_type`: Types of vouchers
    - `validation_status`: Status for validation workflow

  3. Security
    - RLS enabled on all tables
    - Policies for project-based access control
    - Validation workflow restrictions
*/

-- Create enums
CREATE TYPE voucher_type AS ENUM (
  'delivery',
  'evacuation', 
  'concrete',
  'materials'
);

CREATE TYPE validation_status AS ENUM (
  'draft',
  'pending',
  'validated',
  'rejected'
);

-- Vouchers table
CREATE TABLE vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type voucher_type NOT NULL,
  number text NOT NULL,
  supplier text NOT NULL,
  date date NOT NULL,
  materials text,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_price numeric,
  loading_location text,
  unloading_location text,
  truck_type text,
  status validation_status NOT NULL DEFAULT 'draft',
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, number)
);

-- Invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number text NOT NULL,
  supplier text NOT NULL,
  date date NOT NULL,
  due_date date NOT NULL,
  amount_ht numeric NOT NULL,
  amount_ttc numeric NOT NULL,
  vat_rate numeric NOT NULL,
  status validation_status NOT NULL DEFAULT 'draft',
  payment_date date,
  payment_reference text,
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, number)
);

-- Voucher-Invoice links
CREATE TABLE voucher_invoice_links (
  voucher_id uuid NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (voucher_id, invoice_id)
);

-- Cost categories
CREATE TABLE cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  description text,
  parent_id uuid REFERENCES cost_categories(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code)
);

-- Cost entries
CREATE TABLE cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES cost_categories(id),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  quantity numeric,
  unit text,
  unit_price numeric,
  invoice_id uuid REFERENCES invoices(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cost budgets
CREATE TABLE cost_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES cost_categories(id),
  amount numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, category_id)
);

-- Enable RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_invoice_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budgets ENABLE ROW LEVEL SECURITY;

-- Vouchers policies
CREATE POLICY "Users can view vouchers for their projects"
  ON vouchers FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create vouchers"
  ON vouchers FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update draft vouchers"
  ON vouchers FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    AND (status = 'draft' OR auth.uid() = validated_by)
  );

-- Invoices policies
CREATE POLICY "Users can view invoices for their projects"
  ON invoices FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update draft invoices"
  ON invoices FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    AND (status = 'draft' OR auth.uid() = validated_by)
  );

-- Cost categories policies
CREATE POLICY "Everyone can view cost categories"
  ON cost_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage cost categories"
  ON cost_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Cost entries policies
CREATE POLICY "Users can view cost entries for their projects"
  ON cost_entries FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage cost entries"
  ON cost_entries FOR ALL
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Cost budgets policies
CREATE POLICY "Users can view budgets for their projects"
  ON cost_budgets FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage budgets"
  ON cost_budgets FOR ALL
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Create indexes
CREATE INDEX idx_vouchers_project_date ON vouchers(project_id, date);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_invoices_project_date ON invoices(project_id, date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_cost_entries_project ON cost_entries(project_id);
CREATE INDEX idx_cost_entries_category ON cost_entries(category_id);
CREATE INDEX idx_cost_entries_date ON cost_entries(date);
CREATE INDEX idx_cost_budgets_project ON cost_budgets(project_id);
CREATE INDEX idx_cost_budgets_category ON cost_budgets(category_id);

-- Add triggers for updated_at
CREATE TRIGGER set_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_cost_categories_updated_at
  BEFORE UPDATE ON cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_cost_entries_updated_at
  BEFORE UPDATE ON cost_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_cost_budgets_updated_at
  BEFORE UPDATE ON cost_budgets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insert default cost categories
INSERT INTO cost_categories (name, code, description) VALUES
  ('Main d''œuvre', 'MO', 'Coûts liés au personnel'),
  ('Matériaux', 'MAT', 'Coûts des matériaux'),
  ('Matériel', 'MAE', 'Coûts des équipements et machines'),
  ('Sous-traitance', 'ST', 'Coûts des sous-traitants'),
  ('Frais généraux', 'FG', 'Frais généraux du chantier');