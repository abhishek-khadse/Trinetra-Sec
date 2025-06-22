/*
  # Create threat feeds table

  1. New Tables
    - `threat_feeds`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz, default now())
      - `feed_type` (enum: 'malware', 'phishing', 'ransomware', 'vulnerability', 'exploit')
      - `threat_name` (text)
      - `severity` (enum: 'low', 'medium', 'high', 'critical')
      - `ioc_type` (enum: 'ip', 'domain', 'url', 'hash', 'email')
      - `ioc_value` (text)
      - `description` (text, null)
      - `source` (text, null)
      - `is_active` (boolean, default true)
  
  2. Security
    - Enable RLS on `threat_feeds` table
    - Add policy for all authenticated users to read threat feeds
    - Add policy for admin users to insert, update, and delete threat feeds
*/

-- Create enum types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feed_type') THEN
    CREATE TYPE feed_type AS ENUM ('malware', 'phishing', 'ransomware', 'vulnerability', 'exploit');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ioc_type') THEN
    CREATE TYPE ioc_type AS ENUM ('ip', 'domain', 'url', 'hash', 'email');
  END IF;
END $$;

-- Create threat_feeds table
CREATE TABLE IF NOT EXISTS threat_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  feed_type feed_type NOT NULL,
  threat_name TEXT NOT NULL,
  severity severity_level NOT NULL,
  ioc_type ioc_type NOT NULL,
  ioc_value TEXT NOT NULL,
  description TEXT,
  source TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS threat_feeds_feed_type_idx ON threat_feeds(feed_type);
CREATE INDEX IF NOT EXISTS threat_feeds_severity_idx ON threat_feeds(severity);
CREATE INDEX IF NOT EXISTS threat_feeds_created_at_idx ON threat_feeds(created_at DESC);
CREATE INDEX IF NOT EXISTS threat_feeds_is_active_idx ON threat_feeds(is_active);

-- Enable Row Level Security
ALTER TABLE threat_feeds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All users can read threat feeds"
  ON threat_feeds
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert threat feeds"
  ON threat_feeds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update threat feeds"
  ON threat_feeds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete threat feeds"
  ON threat_feeds
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );