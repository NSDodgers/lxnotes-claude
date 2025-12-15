-- Secure RLS Policies
-- Migration: 20241214_secure_rls
-- Description: Revokes public access and enforces authentication for all tables.

-- ============================================
-- REVOKE PUBLIC ACCESS (DROP EXISTING POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Public read access" ON productions;
DROP POLICY IF EXISTS "Public insert access" ON productions;
DROP POLICY IF EXISTS "Public update access" ON productions;
DROP POLICY IF EXISTS "Public delete access" ON productions;

DROP POLICY IF EXISTS "Public read access" ON notes;
DROP POLICY IF EXISTS "Public insert access" ON notes;
DROP POLICY IF EXISTS "Public update access" ON notes;
DROP POLICY IF EXISTS "Public delete access" ON notes;

DROP POLICY IF EXISTS "Public read access" ON fixtures;
DROP POLICY IF EXISTS "Public insert access" ON fixtures;
DROP POLICY IF EXISTS "Public update access" ON fixtures;
DROP POLICY IF EXISTS "Public delete access" ON fixtures;

DROP POLICY IF EXISTS "Public read access" ON script_pages;
DROP POLICY IF EXISTS "Public insert access" ON script_pages;
DROP POLICY IF EXISTS "Public update access" ON script_pages;
DROP POLICY IF EXISTS "Public delete access" ON script_pages;

DROP POLICY IF EXISTS "Public read access" ON scenes_songs;
DROP POLICY IF EXISTS "Public insert access" ON scenes_songs;
DROP POLICY IF EXISTS "Public update access" ON scenes_songs;
DROP POLICY IF EXISTS "Public delete access" ON scenes_songs;

DROP POLICY IF EXISTS "Public read access" ON work_note_fixture_links;
DROP POLICY IF EXISTS "Public insert access" ON work_note_fixture_links;
DROP POLICY IF EXISTS "Public update access" ON work_note_fixture_links;
DROP POLICY IF EXISTS "Public delete access" ON work_note_fixture_links;

DROP POLICY IF EXISTS "Public read access" ON custom_types;
DROP POLICY IF EXISTS "Public insert access" ON custom_types;
DROP POLICY IF EXISTS "Public update access" ON custom_types;
DROP POLICY IF EXISTS "Public delete access" ON custom_types;

DROP POLICY IF EXISTS "Public read access" ON custom_priorities;
DROP POLICY IF EXISTS "Public insert access" ON custom_priorities;
DROP POLICY IF EXISTS "Public update access" ON custom_priorities;
DROP POLICY IF EXISTS "Public delete access" ON custom_priorities;

DROP POLICY IF EXISTS "Public read access" ON position_orders;
DROP POLICY IF EXISTS "Public insert access" ON position_orders;
DROP POLICY IF EXISTS "Public update access" ON position_orders;
DROP POLICY IF EXISTS "Public delete access" ON position_orders;

-- ============================================
-- ENABLE SECURE AUTHENTICATED ACCESS
-- ============================================
-- Only authenticated users can access the data.
-- TODO: Refine these policies to be tenant-specific (e.g. check production_id members) once the user/production relationship is defined.

-- Productions
CREATE POLICY "Authenticated users can read productions" ON productions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create productions" ON productions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update productions" ON productions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete productions" ON productions
  FOR DELETE TO authenticated USING (true);

-- Notes
CREATE POLICY "Authenticated users can read notes" ON notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create notes" ON notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update notes" ON notes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete notes" ON notes
  FOR DELETE TO authenticated USING (true);

-- Fixtures
CREATE POLICY "Authenticated users can read fixtures" ON fixtures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create fixtures" ON fixtures
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update fixtures" ON fixtures
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete fixtures" ON fixtures
  FOR DELETE TO authenticated USING (true);

-- Script Pages
CREATE POLICY "Authenticated users can read script_pages" ON script_pages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create script_pages" ON script_pages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update script_pages" ON script_pages
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete script_pages" ON script_pages
  FOR DELETE TO authenticated USING (true);

-- Scenes Songs
CREATE POLICY "Authenticated users can read scenes_songs" ON scenes_songs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create scenes_songs" ON scenes_songs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update scenes_songs" ON scenes_songs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete scenes_songs" ON scenes_songs
  FOR DELETE TO authenticated USING (true);

-- Work Note Fixture Links
CREATE POLICY "Authenticated users can read work_note_fixture_links" ON work_note_fixture_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create work_note_fixture_links" ON work_note_fixture_links
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_note_fixture_links" ON work_note_fixture_links
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete work_note_fixture_links" ON work_note_fixture_links
  FOR DELETE TO authenticated USING (true);

-- Custom Types
CREATE POLICY "Authenticated users can read custom_types" ON custom_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create custom_types" ON custom_types
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update custom_types" ON custom_types
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete custom_types" ON custom_types
  FOR DELETE TO authenticated USING (true);

-- Custom Priorities
CREATE POLICY "Authenticated users can read custom_priorities" ON custom_priorities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create custom_priorities" ON custom_priorities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update custom_priorities" ON custom_priorities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete custom_priorities" ON custom_priorities
  FOR DELETE TO authenticated USING (true);

-- Position Orders
CREATE POLICY "Authenticated users can read position_orders" ON position_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create position_orders" ON position_orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update position_orders" ON position_orders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete position_orders" ON position_orders
  FOR DELETE TO authenticated USING (true);
