-- Postgres Best Practices Migration
-- Migration: 20260208000000_postgres_best_practices
-- Description: Implements Supabase Postgres best practices for AI agents
-- Covers: Atomic RPC functions, partial indexes, FORCE RLS, atomic preset upserts

-- ============================================
-- SECTION 1: ATOMIC RPC FOR setPages
-- Wraps DELETE + INSERT in a single transaction
-- to prevent data loss on partial failure
-- ============================================

CREATE OR REPLACE FUNCTION replace_script_pages(
  p_production_id UUID,
  p_pages JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing pages for this production
  DELETE FROM script_pages
  WHERE production_id = p_production_id;

  -- Insert new pages (if any)
  IF jsonb_array_length(p_pages) > 0 THEN
    INSERT INTO script_pages (id, production_id, page_number, first_cue_number)
    SELECT
      COALESCE((elem->>'id')::UUID, gen_random_uuid()),
      p_production_id,
      elem->>'page_number',
      elem->>'first_cue_number'
    FROM jsonb_array_elements(p_pages) AS elem;
  END IF;
END;
$$;

COMMENT ON FUNCTION replace_script_pages IS 'Atomically replaces all script pages for a production in a single transaction';

-- ============================================
-- SECTION 2: ATOMIC RPC FOR setScenesSongs
-- Wraps DELETE + INSERT in a single transaction
-- ============================================

CREATE OR REPLACE FUNCTION replace_scenes_songs(
  p_production_id UUID,
  p_scenes_songs JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing scenes/songs for this production
  DELETE FROM scenes_songs
  WHERE production_id = p_production_id;

  -- Insert new scenes/songs (if any)
  IF jsonb_array_length(p_scenes_songs) > 0 THEN
    INSERT INTO scenes_songs (
      id, production_id, module_type, act_id, script_page_id,
      name, type, first_cue_number, order_index,
      continues_from_id, continues_on_page_id
    )
    SELECT
      COALESCE((elem->>'id')::UUID, gen_random_uuid()),
      p_production_id,
      COALESCE(elem->>'module_type', 'cue'),
      (elem->>'act_id')::UUID,
      (elem->>'script_page_id')::UUID,
      elem->>'name',
      elem->>'type',
      elem->>'first_cue_number',
      COALESCE((elem->>'order_index')::INTEGER, row_number() OVER () - 1),
      (elem->>'continues_from_id')::UUID,
      (elem->>'continues_on_page_id')::UUID
    FROM jsonb_array_elements(p_scenes_songs) AS elem;
  END IF;
END;
$$;

COMMENT ON FUNCTION replace_scenes_songs IS 'Atomically replaces all scenes/songs for a production in a single transaction';

-- ============================================
-- SECTION 3: ATOMIC PRESET UPSERT RPC
-- Single UPDATE with JSONB manipulation to avoid
-- read-modify-write race conditions
-- ============================================

CREATE OR REPLACE FUNCTION upsert_jsonb_preset(
  p_production_id UUID,
  p_column_name TEXT,
  p_preset JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current JSONB;
  v_updated JSONB;
  v_preset_id TEXT;
  v_index INTEGER;
BEGIN
  -- Validate column name (whitelist to prevent injection)
  IF p_column_name NOT IN (
    'email_presets', 'filter_sort_presets', 'page_style_presets', 'print_presets'
  ) THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_name;
  END IF;

  v_preset_id := p_preset->>'id';
  IF v_preset_id IS NULL THEN
    RAISE EXCEPTION 'Preset must have an id field';
  END IF;

  -- Lock the row and get current value
  EXECUTE format(
    'SELECT %I FROM productions WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
    p_column_name
  ) INTO v_current USING p_production_id;

  IF v_current IS NULL THEN
    v_current := '[]'::JSONB;
  END IF;

  -- Find existing preset index
  v_index := NULL;
  FOR i IN 0..jsonb_array_length(v_current) - 1 LOOP
    IF v_current->i->>'id' = v_preset_id THEN
      v_index := i;
      EXIT;
    END IF;
  END LOOP;

  IF v_index IS NOT NULL THEN
    -- Replace existing preset at index
    v_updated := jsonb_set(v_current, ARRAY[v_index::TEXT], p_preset);
  ELSE
    -- Append new preset
    v_updated := v_current || jsonb_build_array(p_preset);
  END IF;

  -- Single atomic UPDATE
  EXECUTE format(
    'UPDATE productions SET %I = $1 WHERE id = $2 AND deleted_at IS NULL',
    p_column_name
  ) USING v_updated, p_production_id;

  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION upsert_jsonb_preset IS 'Atomically upserts a preset in a JSONB array column, preventing read-modify-write race conditions';

-- ============================================
-- SECTION 4: ATOMIC PRESET DELETE RPC
-- ============================================

CREATE OR REPLACE FUNCTION delete_jsonb_preset(
  p_production_id UUID,
  p_column_name TEXT,
  p_preset_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current JSONB;
  v_updated JSONB;
BEGIN
  -- Validate column name (whitelist to prevent injection)
  IF p_column_name NOT IN (
    'email_presets', 'filter_sort_presets', 'page_style_presets', 'print_presets'
  ) THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_name;
  END IF;

  -- Lock the row and get current value
  EXECUTE format(
    'SELECT %I FROM productions WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
    p_column_name
  ) INTO v_current USING p_production_id;

  IF v_current IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Filter out the preset with the given id
  SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
  INTO v_updated
  FROM jsonb_array_elements(v_current) AS elem
  WHERE elem->>'id' != p_preset_id;

  -- Single atomic UPDATE
  EXECUTE format(
    'UPDATE productions SET %I = $1 WHERE id = $2 AND deleted_at IS NULL',
    p_column_name
  ) USING v_updated, p_production_id;

  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION delete_jsonb_preset IS 'Atomically removes a preset from a JSONB array column by preset id';

-- ============================================
-- SECTION 5: PARTIAL INDEX FOR SOFT DELETES
-- Notes queries always filter WHERE deleted_at IS NULL
-- This avoids scanning deleted records
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notes_active
  ON notes(production_id, module_type)
  WHERE deleted_at IS NULL;

-- ============================================
-- SECTION 6: FORCE ROW LEVEL SECURITY
-- Ensures even table owners respect RLS policies.
-- The service_role on Supabase has BYPASSRLS privilege
-- so admin operations continue to work.
-- ============================================

ALTER TABLE productions FORCE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;
ALTER TABLE fixtures FORCE ROW LEVEL SECURITY;
ALTER TABLE script_pages FORCE ROW LEVEL SECURITY;
ALTER TABLE scenes_songs FORCE ROW LEVEL SECURITY;
ALTER TABLE work_note_fixture_links FORCE ROW LEVEL SECURITY;
ALTER TABLE custom_types FORCE ROW LEVEL SECURITY;
ALTER TABLE custom_priorities FORCE ROW LEVEL SECURITY;
ALTER TABLE position_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE production_members FORCE ROW LEVEL SECURITY;
ALTER TABLE production_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE app_settings FORCE ROW LEVEL SECURITY;
