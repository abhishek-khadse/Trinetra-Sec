/*
  # Create file scans tables

  1. New Tables
    - `file_scans`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz, default now())
      - `user_id` (uuid, references user_profiles)
      - `file_name` (text)
      - `file_size` (bigint)
      - `file_hash` (text)
      - `scan_status` (enum: 'pending', 'scanning', 'completed', 'failed')
      - `result_summary` (text, null)
      - `threat_level` (enum: 'none', 'low', 'medium', 'high', 'critical', null)
      - `detection_count` (integer, null)
  
  2. Security
    - Enable RLS on `file_scans` table
    - Add policies for authenticated users to read and create their own scans
    - Add policy for admin users to read all scans
*/

-- Create enum types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status_type') THEN
    CREATE TYPE scan_status_type AS ENUM ('pending', 'scanning', 'completed', 'failed');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'threat_level_type') THEN
    CREATE TYPE threat_level_type AS ENUM ('none', 'low', 'medium', 'high', 'critical');
  END IF;
END $$;

-- Create file_scans table
CREATE TABLE IF NOT EXISTS file_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,
  scan_status scan_status_type NOT NULL DEFAULT 'pending',
  result_summary TEXT,
  threat_level threat_level_type,
  detection_count INTEGER,
  
  -- Add check constraint for scan_status transitions
  CONSTRAINT valid_scan_status_transitions CHECK (
    (scan_status = 'pending') OR
    (scan_status = 'scanning') OR
    (scan_status = 'completed' AND threat_level IS NOT NULL) OR
    (scan_status = 'failed')
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS file_scans_user_id_idx ON file_scans(user_id);
CREATE INDEX IF NOT EXISTS file_scans_threat_level_idx ON file_scans(threat_level);
CREATE INDEX IF NOT EXISTS file_scans_created_at_idx ON file_scans(created_at DESC);

-- Enable Row Level Security
ALTER TABLE file_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own scans"
  ON file_scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scans"
  ON file_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all scans"
  ON file_scans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );