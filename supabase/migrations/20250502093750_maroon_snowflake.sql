/*
  # Ajout de la table des contrats
  
  1. Nouvelles Tables
    - `contracts` - Stocke les informations des contrats
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `type` (text)
      - `reference` (text)
      - `entreprise` (text)
      - `montant_ht` (numeric)
      - `date_debut` (date)
      - `date_fin` (date, nullable)
      - `statut` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contract_amendments` - Stocke les avenants aux contrats
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key)
      - `reference` (text)
      - `description` (text)
      - `montant_ht` (numeric)
      - `date` (date)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
    
    - `contract_documents` - Stocke les documents liés aux contrats
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key)
      - `nom` (text)
      - `type` (text)
      - `url` (text)
      - `date_upload` (timestamptz)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
  
  2. Sécurité
    - RLS désactivé pour le développement
    - Indexes pour les performances
*/

-- Création de la table des contrats
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('fournisseur', 'sous-traitance', 'location', 'commande-unique')),
  reference text NOT NULL,
  entreprise text NOT NULL,
  montant_ht numeric NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, reference)
);

-- Création de la table des avenants
CREATE TABLE contract_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  reference text NOT NULL,
  description text,
  montant_ht numeric NOT NULL,
  date date NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Création de la table des documents
CREATE TABLE contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  date_upload timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Création des index pour les performances
CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_type ON contracts(type);
CREATE INDEX idx_contracts_statut ON contracts(statut);
CREATE INDEX idx_contract_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX idx_contract_documents_contract ON contract_documents(contract_id);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Désactiver RLS pour le développement
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_amendments DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_documents DISABLE ROW LEVEL SECURITY;