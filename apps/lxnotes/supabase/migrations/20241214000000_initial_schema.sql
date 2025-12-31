-- LXNotes Initial Schema
-- Migration: 20241214000000_initial_schema

-- ============================================
-- TABLES
-- ============================================

-- Productions table - the main container for all production data
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  logo TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table - unified notes across all modules (cue, work, production)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('cue', 'work', 'production')),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'complete', 'cancelled')),
  created_by TEXT,
  assigned_to TEXT,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  -- Cue notes specific fields
  cue_number TEXT,
  script_page_id UUID,
  scene_song_id UUID,
  -- Work notes specific fields
  lightwright_item_id TEXT,
  channel_numbers TEXT,
  position_unit TEXT,
  scenery_needs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Script pages table
CREATE TABLE script_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  page_number TEXT NOT NULL,
  first_cue_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes and songs table
CREATE TABLE scenes_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('cue', 'work', 'production')),
  act_id UUID,
  script_page_id UUID REFERENCES script_pages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scene', 'song', 'act')),
  first_cue_number TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  continues_from_id UUID,
  continues_on_page_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixtures table (Lightwright data)
CREATE TABLE fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  lwid TEXT NOT NULL,
  channel INTEGER NOT NULL,
  position TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  fixture_type TEXT NOT NULL,
  purpose TEXT,
  universe INTEGER,
  address INTEGER,
  universe_address_raw TEXT,
  position_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'Hookup CSV',
  source_uploaded_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(production_id, lwid)
);

-- Work note to fixture links (many-to-many)
CREATE TABLE work_note_fixture_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_note_id, fixture_id)
);

-- Custom types per production/module
CREATE TABLE custom_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('cue', 'work', 'production')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(production_id, module_type, value)
);

-- Custom priorities per production/module
CREATE TABLE custom_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('cue', 'work', 'production')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(production_id, module_type, value)
);

-- Position ordering per production
CREATE TABLE position_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  positions TEXT[] NOT NULL DEFAULT '{}',
  order_source TEXT NOT NULL DEFAULT 'alphabetical' CHECK (order_source IN ('csv', 'custom', 'alphabetical')),
  csv_checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(production_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_notes_production_module ON notes(production_id, module_type);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_priority ON notes(priority);
CREATE INDEX idx_fixtures_production ON fixtures(production_id);
CREATE INDEX idx_fixtures_channel ON fixtures(production_id, channel);
CREATE INDEX idx_fixtures_position ON fixtures(production_id, position);
CREATE INDEX idx_script_pages_production ON script_pages(production_id);
CREATE INDEX idx_scenes_songs_production ON scenes_songs(production_id);
CREATE INDEX idx_custom_types_production ON custom_types(production_id, module_type);
CREATE INDEX idx_custom_priorities_production ON custom_priorities(production_id, module_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_note_fixture_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_orders ENABLE ROW LEVEL SECURITY;

-- Public access policies (to be replaced with auth-based policies later)
CREATE POLICY "Public read access" ON productions FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON productions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON productions FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON productions FOR DELETE USING (true);

CREATE POLICY "Public read access" ON notes FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON notes FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON notes FOR DELETE USING (true);

CREATE POLICY "Public read access" ON fixtures FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON fixtures FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON fixtures FOR DELETE USING (true);

CREATE POLICY "Public read access" ON script_pages FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON script_pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON script_pages FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON script_pages FOR DELETE USING (true);

CREATE POLICY "Public read access" ON scenes_songs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON scenes_songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON scenes_songs FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON scenes_songs FOR DELETE USING (true);

CREATE POLICY "Public read access" ON work_note_fixture_links FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON work_note_fixture_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON work_note_fixture_links FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON work_note_fixture_links FOR DELETE USING (true);

CREATE POLICY "Public read access" ON custom_types FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON custom_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON custom_types FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON custom_types FOR DELETE USING (true);

CREATE POLICY "Public read access" ON custom_priorities FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON custom_priorities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON custom_priorities FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON custom_priorities FOR DELETE USING (true);

CREATE POLICY "Public read access" ON position_orders FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON position_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON position_orders FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON position_orders FOR DELETE USING (true);

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for collaborative tables
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE fixtures;
ALTER PUBLICATION supabase_realtime ADD TABLE productions;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_productions_updated_at BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_script_pages_updated_at BEFORE UPDATE ON script_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_songs_updated_at BEFORE UPDATE ON scenes_songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_types_updated_at BEFORE UPDATE ON custom_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_priorities_updated_at BEFORE UPDATE ON custom_priorities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_position_orders_updated_at BEFORE UPDATE ON position_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
