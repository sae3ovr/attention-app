-- Alert.io Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ══════════════════════════════════════
-- USERS
-- ══════════════════════════════════════
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  reputation INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 0,
  is_guardian BOOLEAN NOT NULL DEFAULT FALSE,
  is_ghost_mode BOOLEAN NOT NULL DEFAULT FALSE,
  total_reports INT NOT NULL DEFAULT 0,
  total_confirmations INT NOT NULL DEFAULT 0,
  reports_today INT NOT NULL DEFAULT 0,
  daily_report_limit INT NOT NULL DEFAULT 5,
  verified_incidents INT NOT NULL DEFAULT 0,
  removed_incidents INT NOT NULL DEFAULT 0,
  mentees INT NOT NULL DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_location_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════
-- INCIDENTS
-- ══════════════════════════════════════
CREATE TYPE incident_category AS ENUM (
  'robbery','accident','suspicious','hazard','police','fire',
  'medical','traffic','noise','flood','injured_animal','building_risk','other'
);
CREATE TYPE incident_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE incident_status AS ENUM ('active','resolved','expired','removed');

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  category incident_category NOT NULL DEFAULT 'other',
  severity incident_severity NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'active',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_fake BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_count INT NOT NULL DEFAULT 0,
  deny_count INT NOT NULL DEFAULT 0,
  views INT NOT NULL DEFAULT 0,
  credibility_score DOUBLE PRECISION DEFAULT 0.5,
  photo_url TEXT,
  source VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_location ON incidents (latitude, longitude);
CREATE INDEX idx_incidents_category ON incidents (category);
CREATE INDEX idx_incidents_status ON incidents (status);
CREATE INDEX idx_incidents_created ON incidents (created_at DESC);

-- ══════════════════════════════════════
-- INCIDENT COMMENTS
-- ══════════════════════════════════════
CREATE TABLE incident_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_incident ON incident_comments (incident_id, created_at DESC);

-- ══════════════════════════════════════
-- INCIDENT VOTES (confirm / deny)
-- ══════════════════════════════════════
CREATE TABLE incident_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('confirm','deny')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(incident_id, user_id)
);

-- ══════════════════════════════════════
-- FAMILY GROUPS
-- ══════════════════════════════════════
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(8) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','kid')),
  display_name VARCHAR(100) NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  battery_level INT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_in_safe_zone BOOLEAN DEFAULT TRUE,
  kid_monitor_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ══════════════════════════════════════
-- CHAINS
-- ══════════════════════════════════════
CREATE TABLE chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(8) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chain_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL DEFAULT 'member',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chain_id, user_id)
);

CREATE TABLE chain_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  msg_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (msg_type IN ('text','location','alert','sos')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════
-- TRACKED ITEMS (pets, vehicles, tags, people)
-- ══════════════════════════════════════
CREATE TYPE tracked_item_type AS ENUM ('pet','vehicle','tag','person');

CREATE TABLE tracked_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  item_type tracked_item_type NOT NULL,
  icon VARCHAR(50) DEFAULT 'map-marker',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════
-- SOS CONTACTS
-- ══════════════════════════════════════
CREATE TABLE sos_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════
-- PUBLIC CAMERAS
-- ══════════════════════════════════════
CREATE TABLE public_cameras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  stream_url TEXT NOT NULL,
  cam_type VARCHAR(20) NOT NULL DEFAULT 'other',
  country VARCHAR(50) NOT NULL DEFAULT 'Unknown',
  quality VARCHAR(20) NOT NULL DEFAULT 'standard'
);

-- ══════════════════════════════════════
-- SOS ALERTS LOG
-- ══════════════════════════════════════
CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('sos','family_panic')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  target_contact VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════
-- SEED: Demo user
-- ══════════════════════════════════════
INSERT INTO users (id, email, password_hash, display_name, reputation, level, is_guardian, total_reports, total_confirmations)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'demo@alert.io',
  crypt('demo123', gen_salt('bf')),
  'Demo User',
  1250,
  7,
  FALSE,
  42,
  156
);
