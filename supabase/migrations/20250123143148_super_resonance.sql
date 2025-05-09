/*
  # Désactivation temporaire de RLS pour le développement

  1. Désactivation de RLS
    - Table personnel
    - Table projects
    - Table project_members
    - Table machines
    - Table vouchers
    - Table invoices
    - Table cost_categories
    - Table cost_entries
    - Table cost_budgets
    - Table profiles

  Note: Cette configuration est temporaire pour le développement uniquement.
  Le RLS devra être réactivé avant la mise en production.
*/

-- Désactiver RLS sur toutes les tables
ALTER TABLE personnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter toute confusion
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON personnel;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON project_members;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON machines;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON vouchers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON cost_categories;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON cost_entries;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON cost_budgets;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;