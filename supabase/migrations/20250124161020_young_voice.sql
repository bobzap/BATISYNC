/*
  # Fix events notifications

  1. Changes
    - Make user_id nullable in event_notifications table
    - Remove trigger that creates notifications automatically
    - Add indexes for better performance

  2. Security
    - Keep RLS disabled for development
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_event_created ON events;
DROP FUNCTION IF EXISTS create_event_notification;

-- Modify event_notifications table
ALTER TABLE event_notifications 
ALTER COLUMN user_id DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);