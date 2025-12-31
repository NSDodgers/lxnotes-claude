-- Index Optimization Migration
-- Migration: 20241227000000_index_optimization
-- Description: Adds missing indexes on foreign key columns
-- Resolves: 4 "Unindexed foreign keys" suggestions from Supabase Performance Advisor
--
-- Note: Unused indexes retained (low overhead, may be useful as usage grows)

-- ============================================
-- SECTION 1: ADD MISSING FK INDEXES
-- ============================================

-- production_invitations: Add indexes on foreign key columns
CREATE INDEX IF NOT EXISTS idx_production_invitations_production
  ON production_invitations(production_id);
CREATE INDEX IF NOT EXISTS idx_production_invitations_invited_by
  ON production_invitations(invited_by);

-- scenes_songs: Add index on script_page_id foreign key
CREATE INDEX IF NOT EXISTS idx_scenes_songs_script_page
  ON scenes_songs(script_page_id);

-- work_note_fixture_links: Add indexes on both FK columns (junction table)
CREATE INDEX IF NOT EXISTS idx_work_note_fixture_links_note
  ON work_note_fixture_links(work_note_id);
CREATE INDEX IF NOT EXISTS idx_work_note_fixture_links_fixture
  ON work_note_fixture_links(fixture_id);
