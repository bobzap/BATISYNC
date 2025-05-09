/*
  # Ajout des tables pour la gestion des événements

  1. Nouvelles Tables
    - `events`
      - Stocke les événements du chantier (livraisons, interventions, etc.)
      - Lié aux projets et aux rapports journaliers
    - `event_notifications`
      - Gère les notifications pour les événements
    - `event_participants`
      - Lie les événements aux membres du personnel

  2. Types et Énumérations
    - Type d'événement (livraison, intervention, autre)
    - Statut de l'événement
    - Priorité de l'événement

  3. Relations
    - Événements liés aux projets
    - Événements liés aux rapports journaliers
    - Notifications liées aux événements
*/

-- Types d'énumération pour les événements
CREATE TYPE event_type AS ENUM ('livraison', 'intervention', 'autre');
CREATE TYPE event_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE event_priority AS ENUM ('low', 'medium', 'high');

-- Table des événements
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  status event_status NOT NULL DEFAULT 'pending',
  priority event_priority NOT NULL DEFAULT 'medium',
  report_id uuid, -- Lien optionnel vers un rapport journalier
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des notifications d'événements
CREATE TABLE event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des participants aux événements
CREATE TABLE event_participants (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  personnel_id uuid NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, personnel_id)
);

-- Indexes pour les performances
CREATE INDEX idx_events_project ON events(project_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_event_notifications_user ON event_notifications(user_id);
CREATE INDEX idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_personnel ON event_participants(personnel_id);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Fonction pour créer automatiquement des notifications
CREATE OR REPLACE FUNCTION create_event_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une notification pour tous les membres du projet
  INSERT INTO event_notifications (event_id, user_id)
  SELECT 
    NEW.id,
    pm.user_id
  FROM project_members pm
  WHERE pm.project_id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer des notifications lors de la création d'un événement
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_notification();