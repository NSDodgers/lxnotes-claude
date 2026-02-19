-- ============================================
-- SNAPSHOT SECURITY HARDENING
-- ============================================
-- 1. import_production_snapshot: Verify p_user_id matches auth.uid() in clone mode
--    (prevents privilege escalation where caller could specify another user's ID)
-- 2. create_production_snapshot: Use auth.uid() directly instead of trusting p_created_by
-- 3. cleanup_old_snapshots: Restrict execution to service_role only

-- ── 1. import_production_snapshot — add clone-mode caller identity check ──

CREATE OR REPLACE FUNCTION import_production_snapshot(
  p_production_id UUID DEFAULT NULL,
  p_snapshot JSONB DEFAULT NULL,
  p_mode TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_target_id UUID;
  v_id_map JSONB := '{}'::JSONB;
  v_new_id UUID;
  v_elem JSONB;
  v_prod JSONB;
  v_counts JSONB;
  v_inserted_notes INTEGER := 0;
  v_inserted_fixtures INTEGER := 0;
  v_inserted_script_pages INTEGER := 0;
  v_inserted_scenes_songs INTEGER := 0;
  v_inserted_fixture_links INTEGER := 0;
  v_inserted_departments INTEGER := 0;
  v_inserted_department_members INTEGER := 0;
  v_inserted_position_orders INTEGER := 0;
BEGIN
  -- Validate mode
  IF p_mode NOT IN ('restore', 'clone') THEN
    RAISE EXCEPTION 'Invalid mode: %. Must be restore or clone', p_mode;
  END IF;

  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify caller identity for clone mode
  IF p_mode = 'clone' THEN
    IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
      RAISE EXCEPTION 'Access denied: caller must match user_id for clone operations';
    END IF;
  END IF;

  -- Validate snapshot version
  IF (p_snapshot->>'version')::INTEGER != 1 THEN
    RAISE EXCEPTION 'Unsupported snapshot version: %', p_snapshot->>'version';
  END IF;

  -- Verify authorization based on mode
  IF p_mode = 'restore' THEN
    IF p_production_id IS NULL THEN
      RAISE EXCEPTION 'production_id is required for restore mode';
    END IF;
    IF NOT is_production_admin(auth.uid(), p_production_id) THEN
      RAISE EXCEPTION 'Access denied: only admins can restore snapshots';
    END IF;
  END IF;

  v_prod := p_snapshot->'production';

  -- ══════════════════════════════════════════
  -- RESTORE MODE
  -- ══════════════════════════════════════════
  IF p_mode = 'restore' THEN
    v_target_id := p_production_id;

    -- Lock production row
    PERFORM id FROM productions WHERE id = v_target_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Production not found: %', v_target_id;
    END IF;

    -- Delete existing production-scoped data (order respects FK constraints)
    DELETE FROM work_note_fixture_links WHERE work_note_id IN (
      SELECT id FROM notes WHERE production_id = v_target_id
    );
    DELETE FROM department_members WHERE department_id IN (
      SELECT id FROM departments WHERE production_id = v_target_id
    );
    DELETE FROM notes WHERE production_id = v_target_id;
    DELETE FROM fixtures WHERE production_id = v_target_id;
    DELETE FROM scenes_songs WHERE production_id = v_target_id;
    DELETE FROM script_pages WHERE production_id = v_target_id;
    DELETE FROM position_orders WHERE production_id = v_target_id;
    DELETE FROM departments WHERE production_id = v_target_id;

    -- Update production metadata
    UPDATE productions SET
      name = v_prod->>'name',
      abbreviation = v_prod->>'abbreviation',
      logo = v_prod->>'logo',
      description = v_prod->>'description',
      start_date = (v_prod->>'startDate')::DATE,
      end_date = (v_prod->>'endDate')::DATE,
      email_presets = COALESCE(v_prod->'emailPresets', '[]'::JSONB),
      filter_sort_presets = COALESCE(v_prod->'filterSortPresets', '[]'::JSONB),
      page_style_presets = COALESCE(v_prod->'pageStylePresets', '[]'::JSONB),
      print_presets = COALESCE(v_prod->'printPresets', '[]'::JSONB),
      custom_types_config = COALESCE(v_prod->'customTypesConfig', '{}'::JSONB),
      custom_priorities_config = COALESCE(v_prod->'customPrioritiesConfig', '{}'::JSONB)
    WHERE id = v_target_id;

    -- Insert script_pages with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'scriptPages', '[]'::JSONB)) > 0 THEN
      INSERT INTO script_pages (id, production_id, page_number, first_cue_number, created_at, updated_at)
      SELECT
        (elem->>'id')::UUID,
        v_target_id,
        elem->>'page_number',
        elem->>'first_cue_number',
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'scriptPages') AS elem;
      GET DIAGNOSTICS v_inserted_script_pages = ROW_COUNT;
    END IF;

    -- Insert scenes_songs with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'scenesSongs', '[]'::JSONB)) > 0 THEN
      INSERT INTO scenes_songs (
        id, production_id, module_type, act_id, script_page_id,
        name, type, first_cue_number, order_index,
        continues_from_id, continues_on_page_id, created_at, updated_at
      )
      SELECT
        (elem->>'id')::UUID,
        v_target_id,
        COALESCE(elem->>'module_type', 'cue'),
        (elem->>'act_id')::UUID,
        (elem->>'script_page_id')::UUID,
        elem->>'name',
        elem->>'type',
        elem->>'first_cue_number',
        COALESCE((elem->>'order_index')::INTEGER, 0),
        (elem->>'continues_from_id')::UUID,
        (elem->>'continues_on_page_id')::UUID,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'scenesSongs') AS elem;
      GET DIAGNOSTICS v_inserted_scenes_songs = ROW_COUNT;
    END IF;

    -- Insert notes with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'notes', '[]'::JSONB)) > 0 THEN
      INSERT INTO notes (
        id, production_id, module_type, title, description, type, priority, status,
        created_by, assigned_to, completed_by, completed_at, due_date,
        cue_number, script_page_id, scene_song_id,
        lightwright_item_id, channel_numbers, position_unit, scenery_needs,
        app_id, source_department_id, is_transferred, transferred_at,
        deleted_at, deleted_by,
        created_at, updated_at
      )
      SELECT
        (elem->>'id')::UUID,
        v_target_id,
        elem->>'module_type',
        elem->>'title',
        elem->>'description',
        elem->>'type',
        COALESCE(elem->>'priority', 'medium'),
        COALESCE(elem->>'status', 'todo'),
        elem->>'created_by',
        elem->>'assigned_to',
        elem->>'completed_by',
        (elem->>'completed_at')::TIMESTAMPTZ,
        (elem->>'due_date')::TIMESTAMPTZ,
        elem->>'cue_number',
        (elem->>'script_page_id')::UUID,
        (elem->>'scene_song_id')::UUID,
        elem->>'lightwright_item_id',
        elem->>'channel_numbers',
        elem->>'position_unit',
        elem->>'scenery_needs',
        COALESCE(elem->>'app_id', 'lxnotes'),
        (elem->>'source_department_id')::UUID,
        COALESCE((elem->>'is_transferred')::BOOLEAN, FALSE),
        (elem->>'transferred_at')::TIMESTAMPTZ,
        (elem->>'deleted_at')::TIMESTAMPTZ,
        (elem->>'deleted_by')::UUID,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'notes') AS elem;
      GET DIAGNOSTICS v_inserted_notes = ROW_COUNT;
    END IF;

    -- Insert fixtures with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'fixtures', '[]'::JSONB)) > 0 THEN
      INSERT INTO fixtures (
        id, production_id, lwid, channel, position, unit_number, fixture_type,
        purpose, universe, address, universe_address_raw, position_order,
        is_active, source, source_uploaded_at, removed_at,
        created_at, updated_at
      )
      SELECT
        (elem->>'id')::UUID,
        v_target_id,
        elem->>'lwid',
        (elem->>'channel')::INTEGER,
        elem->>'position',
        elem->>'unit_number',
        elem->>'fixture_type',
        elem->>'purpose',
        (elem->>'universe')::INTEGER,
        (elem->>'address')::INTEGER,
        elem->>'universe_address_raw',
        (elem->>'position_order')::INTEGER,
        COALESCE((elem->>'is_active')::BOOLEAN, TRUE),
        COALESCE(elem->>'source', 'Hookup CSV'),
        (elem->>'source_uploaded_at')::TIMESTAMPTZ,
        (elem->>'removed_at')::TIMESTAMPTZ,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'fixtures') AS elem;
      GET DIAGNOSTICS v_inserted_fixtures = ROW_COUNT;
    END IF;

    -- Insert work_note_fixture_links with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'workNoteFixtureLinks', '[]'::JSONB)) > 0 THEN
      INSERT INTO work_note_fixture_links (id, work_note_id, fixture_id, created_at)
      SELECT
        COALESCE((elem->>'id')::UUID, gen_random_uuid()),
        (elem->>'work_note_id')::UUID,
        (elem->>'fixture_id')::UUID,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'workNoteFixtureLinks') AS elem
      WHERE (elem->>'work_note_id') IS NOT NULL
        AND (elem->>'fixture_id') IS NOT NULL;
      GET DIAGNOSTICS v_inserted_fixture_links = ROW_COUNT;
    END IF;

    -- Insert position_orders with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'positionOrders', '[]'::JSONB)) > 0 THEN
      INSERT INTO position_orders (id, production_id, positions, order_source, csv_checksum, created_at, updated_at)
      SELECT
        (elem->>'id')::UUID,
        v_target_id,
        ARRAY(SELECT jsonb_array_elements_text(elem->'positions')),
        COALESCE(elem->>'order_source', 'alphabetical'),
        elem->>'csv_checksum',
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'positionOrders') AS elem;
      GET DIAGNOSTICS v_inserted_position_orders = ROW_COUNT;
    END IF;

    -- Insert departments with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'departments', '[]'::JSONB)) > 0 THEN
      INSERT INTO departments (id, production_id, name, slug, app_id, color, is_active, created_at, updated_at)
      SELECT
        (elem->>'id')::UUID,
        v_target_id,
        elem->>'name',
        elem->>'slug',
        COALESCE(elem->>'app_id', 'lxnotes'),
        elem->>'color',
        COALESCE((elem->>'is_active')::BOOLEAN, TRUE),
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'departments') AS elem;
      GET DIAGNOSTICS v_inserted_departments = ROW_COUNT;
    END IF;

    -- Insert department_members with original IDs
    IF jsonb_array_length(COALESCE(p_snapshot->'departmentMembers', '[]'::JSONB)) > 0 THEN
      INSERT INTO department_members (id, department_id, user_id, role, created_at)
      SELECT
        COALESCE((elem->>'id')::UUID, gen_random_uuid()),
        (elem->>'department_id')::UUID,
        (elem->>'user_id')::UUID,
        COALESCE(elem->>'role', 'member'),
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'departmentMembers') AS elem
      WHERE (elem->>'department_id') IS NOT NULL
        AND (elem->>'user_id') IS NOT NULL
        -- Only insert if the user exists
        AND EXISTS (SELECT 1 FROM users WHERE id = (elem->>'user_id')::UUID);
      GET DIAGNOSTICS v_inserted_department_members = ROW_COUNT;
    END IF;

  -- ══════════════════════════════════════════
  -- CLONE MODE
  -- ══════════════════════════════════════════
  ELSIF p_mode = 'clone' THEN
    -- Create new production
    v_target_id := gen_random_uuid();

    INSERT INTO productions (
      id, name, abbreviation, logo, description, start_date, end_date,
      email_presets, filter_sort_presets, page_style_presets, print_presets,
      custom_types_config, custom_priorities_config
    )
    VALUES (
      v_target_id,
      v_prod->>'name',
      v_prod->>'abbreviation',
      v_prod->>'logo',
      v_prod->>'description',
      (v_prod->>'startDate')::DATE,
      (v_prod->>'endDate')::DATE,
      COALESCE(v_prod->'emailPresets', '[]'::JSONB),
      COALESCE(v_prod->'filterSortPresets', '[]'::JSONB),
      COALESCE(v_prod->'pageStylePresets', '[]'::JSONB),
      COALESCE(v_prod->'printPresets', '[]'::JSONB),
      COALESCE(v_prod->'customTypesConfig', '{}'::JSONB),
      COALESCE(v_prod->'customPrioritiesConfig', '{}'::JSONB)
    );

    -- Add importing user as admin (ON CONFLICT handles the case where
    -- the on_production_created trigger already inserted this row)
    INSERT INTO production_members (production_id, user_id, role)
    VALUES (v_target_id, p_user_id, 'admin')
    ON CONFLICT (production_id, user_id) DO NOTHING;

    -- ── Build UUID remap table ──
    -- Map every entity ID to a new random UUID

    -- Script pages
    FOR v_elem IN SELECT jsonb_array_elements(COALESCE(p_snapshot->'scriptPages', '[]'::JSONB))
    LOOP
      v_new_id := gen_random_uuid();
      v_id_map := v_id_map || jsonb_build_object(v_elem->>'id', v_new_id::TEXT);
    END LOOP;

    -- Scenes/songs
    FOR v_elem IN SELECT jsonb_array_elements(COALESCE(p_snapshot->'scenesSongs', '[]'::JSONB))
    LOOP
      v_new_id := gen_random_uuid();
      v_id_map := v_id_map || jsonb_build_object(v_elem->>'id', v_new_id::TEXT);
    END LOOP;

    -- Notes
    FOR v_elem IN SELECT jsonb_array_elements(COALESCE(p_snapshot->'notes', '[]'::JSONB))
    LOOP
      v_new_id := gen_random_uuid();
      v_id_map := v_id_map || jsonb_build_object(v_elem->>'id', v_new_id::TEXT);
    END LOOP;

    -- Fixtures
    FOR v_elem IN SELECT jsonb_array_elements(COALESCE(p_snapshot->'fixtures', '[]'::JSONB))
    LOOP
      v_new_id := gen_random_uuid();
      v_id_map := v_id_map || jsonb_build_object(v_elem->>'id', v_new_id::TEXT);
    END LOOP;

    -- Departments
    FOR v_elem IN SELECT jsonb_array_elements(COALESCE(p_snapshot->'departments', '[]'::JSONB))
    LOOP
      v_new_id := gen_random_uuid();
      v_id_map := v_id_map || jsonb_build_object(v_elem->>'id', v_new_id::TEXT);
    END LOOP;

    -- Position orders
    FOR v_elem IN SELECT jsonb_array_elements(COALESCE(p_snapshot->'positionOrders', '[]'::JSONB))
    LOOP
      v_new_id := gen_random_uuid();
      v_id_map := v_id_map || jsonb_build_object(v_elem->>'id', v_new_id::TEXT);
    END LOOP;

    -- ── Insert with remapped IDs ──

    -- Script pages (only remaps: id)
    IF jsonb_array_length(COALESCE(p_snapshot->'scriptPages', '[]'::JSONB)) > 0 THEN
      INSERT INTO script_pages (id, production_id, page_number, first_cue_number, created_at, updated_at)
      SELECT
        (v_id_map->>(elem->>'id'))::UUID,
        v_target_id,
        elem->>'page_number',
        elem->>'first_cue_number',
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'scriptPages') AS elem;
      GET DIAGNOSTICS v_inserted_script_pages = ROW_COUNT;
    END IF;

    -- Scenes/songs (remaps: id, script_page_id, act_id, continues_from_id, continues_on_page_id)
    IF jsonb_array_length(COALESCE(p_snapshot->'scenesSongs', '[]'::JSONB)) > 0 THEN
      INSERT INTO scenes_songs (
        id, production_id, module_type, act_id, script_page_id,
        name, type, first_cue_number, order_index,
        continues_from_id, continues_on_page_id, created_at, updated_at
      )
      SELECT
        (v_id_map->>(elem->>'id'))::UUID,
        v_target_id,
        COALESCE(elem->>'module_type', 'cue'),
        CASE WHEN elem->>'act_id' IS NOT NULL THEN (v_id_map->>(elem->>'act_id'))::UUID ELSE NULL END,
        CASE WHEN elem->>'script_page_id' IS NOT NULL THEN (v_id_map->>(elem->>'script_page_id'))::UUID ELSE NULL END,
        elem->>'name',
        elem->>'type',
        elem->>'first_cue_number',
        COALESCE((elem->>'order_index')::INTEGER, 0),
        CASE WHEN elem->>'continues_from_id' IS NOT NULL THEN (v_id_map->>(elem->>'continues_from_id'))::UUID ELSE NULL END,
        CASE WHEN elem->>'continues_on_page_id' IS NOT NULL THEN (v_id_map->>(elem->>'continues_on_page_id'))::UUID ELSE NULL END,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'scenesSongs') AS elem;
      GET DIAGNOSTICS v_inserted_scenes_songs = ROW_COUNT;
    END IF;

    -- Notes (remaps: id, script_page_id, scene_song_id, source_department_id)
    -- NOT remapped: created_by, assigned_to, completed_by, deleted_by (external user references)
    IF jsonb_array_length(COALESCE(p_snapshot->'notes', '[]'::JSONB)) > 0 THEN
      INSERT INTO notes (
        id, production_id, module_type, title, description, type, priority, status,
        created_by, assigned_to, completed_by, completed_at, due_date,
        cue_number, script_page_id, scene_song_id,
        lightwright_item_id, channel_numbers, position_unit, scenery_needs,
        app_id, source_department_id, is_transferred, transferred_at,
        deleted_at, deleted_by,
        created_at, updated_at
      )
      SELECT
        (v_id_map->>(elem->>'id'))::UUID,
        v_target_id,
        elem->>'module_type',
        elem->>'title',
        elem->>'description',
        elem->>'type',
        COALESCE(elem->>'priority', 'medium'),
        COALESCE(elem->>'status', 'todo'),
        elem->>'created_by',
        elem->>'assigned_to',
        elem->>'completed_by',
        (elem->>'completed_at')::TIMESTAMPTZ,
        (elem->>'due_date')::TIMESTAMPTZ,
        elem->>'cue_number',
        CASE WHEN elem->>'script_page_id' IS NOT NULL THEN (v_id_map->>(elem->>'script_page_id'))::UUID ELSE NULL END,
        CASE WHEN elem->>'scene_song_id' IS NOT NULL THEN (v_id_map->>(elem->>'scene_song_id'))::UUID ELSE NULL END,
        elem->>'lightwright_item_id',
        elem->>'channel_numbers',
        elem->>'position_unit',
        elem->>'scenery_needs',
        COALESCE(elem->>'app_id', 'lxnotes'),
        CASE WHEN elem->>'source_department_id' IS NOT NULL THEN (v_id_map->>(elem->>'source_department_id'))::UUID ELSE NULL END,
        COALESCE((elem->>'is_transferred')::BOOLEAN, FALSE),
        (elem->>'transferred_at')::TIMESTAMPTZ,
        (elem->>'deleted_at')::TIMESTAMPTZ,
        (elem->>'deleted_by')::UUID,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'notes') AS elem;
      GET DIAGNOSTICS v_inserted_notes = ROW_COUNT;
    END IF;

    -- Fixtures (remaps: id only)
    IF jsonb_array_length(COALESCE(p_snapshot->'fixtures', '[]'::JSONB)) > 0 THEN
      INSERT INTO fixtures (
        id, production_id, lwid, channel, position, unit_number, fixture_type,
        purpose, universe, address, universe_address_raw, position_order,
        is_active, source, source_uploaded_at, removed_at,
        created_at, updated_at
      )
      SELECT
        (v_id_map->>(elem->>'id'))::UUID,
        v_target_id,
        elem->>'lwid',
        (elem->>'channel')::INTEGER,
        elem->>'position',
        elem->>'unit_number',
        elem->>'fixture_type',
        elem->>'purpose',
        (elem->>'universe')::INTEGER,
        (elem->>'address')::INTEGER,
        elem->>'universe_address_raw',
        (elem->>'position_order')::INTEGER,
        COALESCE((elem->>'is_active')::BOOLEAN, TRUE),
        COALESCE(elem->>'source', 'Hookup CSV'),
        (elem->>'source_uploaded_at')::TIMESTAMPTZ,
        (elem->>'removed_at')::TIMESTAMPTZ,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'fixtures') AS elem;
      GET DIAGNOSTICS v_inserted_fixtures = ROW_COUNT;
    END IF;

    -- Work note fixture links (remaps: work_note_id, fixture_id)
    -- Skip links where either side doesn't map (orphaned)
    IF jsonb_array_length(COALESCE(p_snapshot->'workNoteFixtureLinks', '[]'::JSONB)) > 0 THEN
      INSERT INTO work_note_fixture_links (id, work_note_id, fixture_id, created_at)
      SELECT
        gen_random_uuid(),
        (v_id_map->>(elem->>'work_note_id'))::UUID,
        (v_id_map->>(elem->>'fixture_id'))::UUID,
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'workNoteFixtureLinks') AS elem
      WHERE v_id_map ? (elem->>'work_note_id')
        AND v_id_map ? (elem->>'fixture_id');
      GET DIAGNOSTICS v_inserted_fixture_links = ROW_COUNT;
    END IF;

    -- Position orders (remaps: id only)
    IF jsonb_array_length(COALESCE(p_snapshot->'positionOrders', '[]'::JSONB)) > 0 THEN
      INSERT INTO position_orders (id, production_id, positions, order_source, csv_checksum, created_at, updated_at)
      SELECT
        (v_id_map->>(elem->>'id'))::UUID,
        v_target_id,
        ARRAY(SELECT jsonb_array_elements_text(elem->'positions')),
        COALESCE(elem->>'order_source', 'alphabetical'),
        elem->>'csv_checksum',
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'positionOrders') AS elem;
      GET DIAGNOSTICS v_inserted_position_orders = ROW_COUNT;
    END IF;

    -- Departments (remaps: id only)
    IF jsonb_array_length(COALESCE(p_snapshot->'departments', '[]'::JSONB)) > 0 THEN
      INSERT INTO departments (id, production_id, name, slug, app_id, color, is_active, created_at, updated_at)
      SELECT
        (v_id_map->>(elem->>'id'))::UUID,
        v_target_id,
        elem->>'name',
        elem->>'slug',
        COALESCE(elem->>'app_id', 'lxnotes'),
        elem->>'color',
        COALESCE((elem->>'is_active')::BOOLEAN, TRUE),
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW()),
        COALESCE((elem->>'updated_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'departments') AS elem;
      GET DIAGNOSTICS v_inserted_departments = ROW_COUNT;
    END IF;

    -- Department members (remaps: department_id; keeps user_id as-is)
    IF jsonb_array_length(COALESCE(p_snapshot->'departmentMembers', '[]'::JSONB)) > 0 THEN
      INSERT INTO department_members (id, department_id, user_id, role, created_at)
      SELECT
        gen_random_uuid(),
        (v_id_map->>(elem->>'department_id'))::UUID,
        (elem->>'user_id')::UUID,
        COALESCE(elem->>'role', 'member'),
        COALESCE((elem->>'created_at')::TIMESTAMPTZ, NOW())
      FROM jsonb_array_elements(p_snapshot->'departmentMembers') AS elem
      WHERE v_id_map ? (elem->>'department_id')
        AND (elem->>'user_id') IS NOT NULL
        AND EXISTS (SELECT 1 FROM users WHERE id = (elem->>'user_id')::UUID);
      GET DIAGNOSTICS v_inserted_department_members = ROW_COUNT;
    END IF;

  END IF;

  -- Build result counts
  v_counts := jsonb_build_object(
    'notes', v_inserted_notes,
    'fixtures', v_inserted_fixtures,
    'scriptPages', v_inserted_script_pages,
    'scenesSongs', v_inserted_scenes_songs,
    'workNoteFixtureLinks', v_inserted_fixture_links,
    'positionOrders', v_inserted_position_orders,
    'departments', v_inserted_departments,
    'departmentMembers', v_inserted_department_members
  );

  RETURN jsonb_build_object(
    'success', true,
    'productionId', v_target_id,
    'mode', p_mode,
    'counts', v_counts
  );
END;
$$;

COMMENT ON FUNCTION import_production_snapshot IS 'Imports a production snapshot - restore mode replaces data in-place, clone mode creates a new production with remapped UUIDs';


-- ── 2. create_production_snapshot — use auth.uid() instead of trusting p_created_by ──

CREATE OR REPLACE FUNCTION create_production_snapshot(
  p_production_id UUID,
  p_trigger_reason TEXT,
  p_created_by UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot_data JSONB;
  v_snapshot_id UUID;
  v_entity_counts JSONB;
BEGIN
  -- Verify caller has access to this production
  IF NOT has_production_access(auth.uid(), p_production_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of this production';
  END IF;

  -- Export current production state
  v_snapshot_data := export_production_snapshot(p_production_id);

  -- Extract counts from snapshot
  v_entity_counts := v_snapshot_data->'counts';

  -- Insert snapshot (use auth.uid() directly instead of trusting p_created_by)
  INSERT INTO production_snapshots (production_id, snapshot_data, trigger_reason, created_by, note, entity_counts)
  VALUES (p_production_id, v_snapshot_data, p_trigger_reason, auth.uid(), p_note, v_entity_counts)
  RETURNING id INTO v_snapshot_id;

  -- Retention is now handled by the daily cron via cleanup_old_snapshots()
  -- No inline pruning here

  RETURN v_snapshot_id;
END;
$$;

COMMENT ON FUNCTION create_production_snapshot IS 'Creates a server-side snapshot. Retention enforced by daily cron (tiered: 14d full, 90d thinned, then expired).';


-- ── 3. cleanup_old_snapshots — restrict to service_role only ──

REVOKE EXECUTE ON FUNCTION public.cleanup_old_snapshots() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_snapshots() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_snapshots() TO service_role;
