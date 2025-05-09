/*
  # Base Tables for ChantierApp

  1. New Tables
    - `projects` - Project management
      - `id` (uuid, primary key)
      - `name` (text)
      - `number` (text)
      - `site_manager` (text)
      - `ctx_manager` (text)
      - `cm_ce` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `project_members` - Project team members
      - `project_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `roles` - User roles and permissions
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `permissions` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for project members
*/

-- Create enum for member roles
CREATE TYPE project_role AS ENUM (
  'admin',
  'manager',
  'member',
  'viewer'
);

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  number text NOT NULL UNIQUE,
  site_manager text,
  ctx_manager text,
  cm_ce text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project members table
CREATE TABLE project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE role = 'admin'
    )
  );

CREATE POLICY "Project admins can update their projects"
  ON projects FOR UPDATE
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Project members policies
CREATE POLICY "Users can view project members for their projects"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage project members"
  ON project_members FOR ALL
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Roles policies
CREATE POLICY "Users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can manage roles"
  ON roles FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_projects_active ON projects(active);
CREATE INDEX idx_projects_number ON projects(number);

-- Update trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('super_admin', 'Super administrator with full access', '["*"]'),
  ('admin', 'Project administrator', '["project.*", "member.*", "report.*"]'),
  ('manager', 'Project manager', '["project.view", "member.view", "report.*"]'),
  ('member', 'Project member', '["project.view", "member.view", "report.create"]'),
  ('viewer', 'Read-only access', '["project.view", "member.view", "report.view"]');