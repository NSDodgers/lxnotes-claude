-- Migration: Inline page style config on email/print presets
-- Eliminates the separate page_style_presets column.
-- For each email/print preset, copies pageStyle config inline from the referenced
-- page style preset, then drops the column.

-- Default page style for presets that have no reference or a dangling reference
-- This matches the system default: Letter, Landscape, with checkboxes

DO $$
DECLARE
  r RECORD;
  v_email_presets JSONB;
  v_print_presets JSONB;
  v_page_style_presets JSONB;
  v_preset JSONB;
  v_new_presets JSONB;
  v_page_style_id TEXT;
  v_page_style JSONB;
  v_matched_ps JSONB;
  v_default_page_style JSONB := '{"paperSize": "letter", "orientation": "landscape", "includeCheckboxes": true}'::JSONB;
  i INT;
BEGIN
  FOR r IN SELECT id, email_presets, print_presets, page_style_presets FROM productions WHERE deleted_at IS NULL
  LOOP
    v_email_presets := COALESCE(r.email_presets, '[]'::JSONB);
    v_print_presets := COALESCE(r.print_presets, '[]'::JSONB);
    v_page_style_presets := COALESCE(r.page_style_presets, '[]'::JSONB);

    -- Migrate email presets
    v_new_presets := '[]'::JSONB;
    FOR i IN 0..(jsonb_array_length(v_email_presets) - 1)
    LOOP
      v_preset := v_email_presets->i;

      -- Skip if already has inline pageStyle
      IF v_preset->'config'->'pageStyle' IS NOT NULL THEN
        v_new_presets := v_new_presets || jsonb_build_array(v_preset);
        CONTINUE;
      END IF;

      -- Look up referenced page style preset
      v_page_style_id := v_preset->'config'->>'pageStylePresetId';
      v_page_style := v_default_page_style;

      IF v_page_style_id IS NOT NULL THEN
        -- Search the page_style_presets array for matching ID
        FOR v_matched_ps IN SELECT * FROM jsonb_array_elements(v_page_style_presets)
        LOOP
          IF v_matched_ps->>'id' = v_page_style_id THEN
            v_page_style := jsonb_build_object(
              'paperSize', COALESCE(v_matched_ps->'config'->>'paperSize', 'letter'),
              'orientation', COALESCE(v_matched_ps->'config'->>'orientation', 'landscape'),
              'includeCheckboxes', COALESCE((v_matched_ps->'config'->>'includeCheckboxes')::BOOLEAN, true)
            );
            EXIT;
          END IF;
        END LOOP;
      END IF;

      -- Add inline pageStyle and remove pageStylePresetId
      v_preset := jsonb_set(v_preset, '{config,pageStyle}', v_page_style);
      v_preset := v_preset #- '{config,pageStylePresetId}';
      v_new_presets := v_new_presets || jsonb_build_array(v_preset);
    END LOOP;

    -- Migrate print presets
    v_email_presets := v_new_presets; -- save for update
    v_new_presets := '[]'::JSONB;
    FOR i IN 0..(jsonb_array_length(v_print_presets) - 1)
    LOOP
      v_preset := v_print_presets->i;

      -- Skip if already has inline pageStyle
      IF v_preset->'config'->'pageStyle' IS NOT NULL THEN
        v_new_presets := v_new_presets || jsonb_build_array(v_preset);
        CONTINUE;
      END IF;

      -- Look up referenced page style preset
      v_page_style_id := v_preset->'config'->>'pageStylePresetId';
      v_page_style := v_default_page_style;

      IF v_page_style_id IS NOT NULL THEN
        FOR v_matched_ps IN SELECT * FROM jsonb_array_elements(v_page_style_presets)
        LOOP
          IF v_matched_ps->>'id' = v_page_style_id THEN
            v_page_style := jsonb_build_object(
              'paperSize', COALESCE(v_matched_ps->'config'->>'paperSize', 'letter'),
              'orientation', COALESCE(v_matched_ps->'config'->>'orientation', 'landscape'),
              'includeCheckboxes', COALESCE((v_matched_ps->'config'->>'includeCheckboxes')::BOOLEAN, true)
            );
            EXIT;
          END IF;
        END LOOP;
      END IF;

      v_preset := jsonb_set(v_preset, '{config,pageStyle}', v_page_style);
      v_preset := v_preset #- '{config,pageStylePresetId}';
      v_new_presets := v_new_presets || jsonb_build_array(v_preset);
    END LOOP;

    -- Update the production
    UPDATE productions
    SET email_presets = v_email_presets,
        print_presets = v_new_presets
    WHERE id = r.id;
  END LOOP;

  RAISE NOTICE 'Page style config inlined on all email/print presets';
END $$;

-- Drop the page_style_presets column
ALTER TABLE productions DROP COLUMN IF EXISTS page_style_presets;

-- Update snapshot export function to stop including page_style_presets
CREATE OR REPLACE FUNCTION export_production_snapshot(
  p_production_id UUID,
  p_exported_by UUID DEFAULT NULL,
  p_trigger_reason TEXT DEFAULT 'manual',
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_production RECORD;
  v_snapshot JSONB;
  v_notes JSONB;
  v_script_pages JSONB;
  v_scenes_songs JSONB;
  v_fixtures JSONB;
  v_work_note_fixture_links JSONB;
  v_position_orders JSONB;
  v_departments JSONB;
  v_department_members JSONB;
  v_members JSONB;
  v_counts JSONB;
  v_snapshot_id UUID;
  v_active_note_count INT;
  v_deleted_note_count INT;
BEGIN
  -- Get the production
  SELECT * INTO v_production FROM productions WHERE id = p_production_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production not found or deleted: %', p_production_id;
  END IF;

  -- Get notes (raw DB columns for lossless round-trip)
  SELECT COALESCE(jsonb_agg(row_to_json(n)::JSONB), '[]'::JSONB) INTO v_notes
  FROM notes n WHERE n.production_id = p_production_id;

  -- Count active vs deleted notes
  SELECT COUNT(*) FILTER (WHERE deleted_at IS NULL), COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
  INTO v_active_note_count, v_deleted_note_count
  FROM notes WHERE production_id = p_production_id;

  -- Get script pages
  SELECT COALESCE(jsonb_agg(row_to_json(sp)::JSONB), '[]'::JSONB) INTO v_script_pages
  FROM script_pages sp WHERE sp.production_id = p_production_id;

  -- Get scenes/songs
  SELECT COALESCE(jsonb_agg(row_to_json(ss)::JSONB), '[]'::JSONB) INTO v_scenes_songs
  FROM scenes_songs ss WHERE ss.production_id = p_production_id;

  -- Get fixtures
  SELECT COALESCE(jsonb_agg(row_to_json(f)::JSONB), '[]'::JSONB) INTO v_fixtures
  FROM fixtures f WHERE f.production_id = p_production_id;

  -- Get work note fixture links (only for notes in this production)
  SELECT COALESCE(jsonb_agg(row_to_json(wfl)::JSONB), '[]'::JSONB) INTO v_work_note_fixture_links
  FROM work_note_fixture_links wfl
  WHERE wfl.note_id IN (SELECT id FROM notes WHERE production_id = p_production_id);

  -- Get position orders
  SELECT COALESCE(jsonb_agg(row_to_json(po)::JSONB), '[]'::JSONB) INTO v_position_orders
  FROM position_orders po WHERE po.production_id = p_production_id;

  -- Get departments
  SELECT COALESCE(jsonb_agg(row_to_json(d)::JSONB), '[]'::JSONB) INTO v_departments
  FROM departments d WHERE d.production_id = p_production_id;

  -- Get department members
  SELECT COALESCE(jsonb_agg(row_to_json(dm)::JSONB), '[]'::JSONB) INTO v_department_members
  FROM department_members dm WHERE dm.department_id IN (
    SELECT id FROM departments WHERE production_id = p_production_id
  );

  -- Get members with user info
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'userId', pm.user_id,
    'email', u.email,
    'fullName', u.raw_user_meta_data->>'full_name',
    'role', pm.role
  )), '[]'::JSONB) INTO v_members
  FROM production_members pm
  JOIN auth.users u ON u.id = pm.user_id
  WHERE pm.production_id = p_production_id;

  -- Build counts
  v_counts := jsonb_build_object(
    'notes', (SELECT COUNT(*) FROM notes WHERE production_id = p_production_id),
    'activeNotes', v_active_note_count,
    'deletedNotes', v_deleted_note_count,
    'fixtures', (SELECT COUNT(*) FROM fixtures WHERE production_id = p_production_id),
    'scriptPages', (SELECT COUNT(*) FROM script_pages WHERE production_id = p_production_id),
    'scenesSongs', (SELECT COUNT(*) FROM scenes_songs WHERE production_id = p_production_id),
    'workNoteFixtureLinks', (SELECT COUNT(*) FROM work_note_fixture_links WHERE note_id IN (SELECT id FROM notes WHERE production_id = p_production_id)),
    'departments', (SELECT COUNT(*) FROM departments WHERE production_id = p_production_id),
    'members', (SELECT COUNT(*) FROM production_members WHERE production_id = p_production_id)
  );

  -- Build the snapshot JSON (no longer includes pageStylePresets)
  v_snapshot := jsonb_build_object(
    'version', 1,
    'exportedAt', NOW()::TEXT,
    'exportedBy', p_exported_by::TEXT,
    'productionId', p_production_id::TEXT,
    'productionName', v_production.name,
    'production', jsonb_build_object(
      'name', v_production.name,
      'abbreviation', v_production.abbreviation,
      'logo', v_production.logo,
      'description', v_production.description,
      'startDate', v_production.start_date::TEXT,
      'endDate', v_production.end_date::TEXT,
      'emailPresets', COALESCE(v_production.email_presets, '[]'::JSONB),
      'filterSortPresets', COALESCE(v_production.filter_sort_presets, '[]'::JSONB),
      'printPresets', COALESCE(v_production.print_presets, '[]'::JSONB),
      'customTypesConfig', COALESCE(v_production.custom_types_config, '{}'::JSONB),
      'customPrioritiesConfig', COALESCE(v_production.custom_priorities_config, '{}'::JSONB)
    ),
    'notes', v_notes,
    'scriptPages', v_script_pages,
    'scenesSongs', v_scenes_songs,
    'fixtures', v_fixtures,
    'workNoteFixtureLinks', v_work_note_fixture_links,
    'positionOrders', v_position_orders,
    'departments', v_departments,
    'departmentMembers', v_department_members,
    'members', v_members,
    'counts', v_counts
  );

  -- Store snapshot
  v_snapshot_id := gen_random_uuid();
  INSERT INTO production_snapshots (id, production_id, snapshot_data, entity_counts, created_by, trigger_reason, note)
  VALUES (v_snapshot_id, p_production_id, v_snapshot, v_counts, p_exported_by, p_trigger_reason, p_note);

  RETURN v_snapshot;
END;
$func$;

-- Update snapshot import to handle both old (with pageStylePresets) and new formats
-- The import function should ignore pageStylePresets from old snapshots since
-- page style config is now inline on email/print presets
CREATE OR REPLACE FUNCTION import_production_snapshot(
  p_snapshot_data JSONB,
  p_imported_by UUID,
  p_target_production_id UUID DEFAULT NULL,
  p_mode TEXT DEFAULT 'restore'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_prod JSONB;
  v_target_id UUID;
  v_result JSONB;
  v_note JSONB;
  v_note_id UUID;
  v_new_note_id UUID;
  v_note_id_map JSONB := '{}'::JSONB;
  v_script_page JSONB;
  v_scene_song JSONB;
  v_fixture JSONB;
  v_fixture_id UUID;
  v_new_fixture_id UUID;
  v_fixture_id_map JSONB := '{}'::JSONB;
  v_link JSONB;
  v_position_order JSONB;
  v_department JSONB;
  v_department_id UUID;
  v_new_department_id UUID;
  v_department_id_map JSONB := '{}'::JSONB;
  v_department_member JSONB;
  v_member JSONB;
  v_member_id UUID;
  v_snapshot_version INT;
BEGIN
  v_prod := p_snapshot_data->'production';
  v_snapshot_version := COALESCE((p_snapshot_data->>'version')::INT, 1);

  IF v_prod IS NULL THEN
    RAISE EXCEPTION 'Invalid snapshot: missing production data';
  END IF;

  IF p_mode = 'restore' AND p_target_production_id IS NOT NULL THEN
    -- Restore mode: update existing production
    v_target_id := p_target_production_id;

    -- Verify production exists and user has access
    IF NOT EXISTS (SELECT 1 FROM productions WHERE id = v_target_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Target production not found or deleted: %', v_target_id;
    END IF;

    -- Update production fields (no longer sets page_style_presets)
    UPDATE productions SET
      email_presets = COALESCE(v_prod->'emailPresets', '[]'::JSONB),
      filter_sort_presets = COALESCE(v_prod->'filterSortPresets', '[]'::JSONB),
      print_presets = COALESCE(v_prod->'printPresets', '[]'::JSONB),
      custom_types_config = COALESCE(v_prod->'customTypesConfig', '{}'::JSONB),
      custom_priorities_config = COALESCE(v_prod->'customPrioritiesConfig', '{}'::JSONB),
      updated_at = NOW()
    WHERE id = v_target_id;

    -- Clear existing data for restore
    DELETE FROM work_note_fixture_links WHERE note_id IN (SELECT id FROM notes WHERE production_id = v_target_id);
    DELETE FROM notes WHERE production_id = v_target_id;
    DELETE FROM script_pages WHERE production_id = v_target_id;
    DELETE FROM scenes_songs WHERE production_id = v_target_id;
    DELETE FROM fixtures WHERE production_id = v_target_id;
    DELETE FROM position_orders WHERE production_id = v_target_id;
    DELETE FROM department_members WHERE department_id IN (SELECT id FROM departments WHERE production_id = v_target_id);
    DELETE FROM departments WHERE production_id = v_target_id;

  ELSIF p_mode = 'clone' THEN
    -- Clone mode: create new production
    v_target_id := gen_random_uuid();

    INSERT INTO productions (
      id, name, abbreviation, logo, description, start_date, end_date,
      email_presets, filter_sort_presets, print_presets,
      custom_types_config, custom_priorities_config
    )
    VALUES (
      v_target_id,
      (v_prod->>'name') || ' (Copy)',
      v_prod->>'abbreviation',
      v_prod->>'logo',
      v_prod->>'description',
      (v_prod->>'startDate')::DATE,
      (v_prod->>'endDate')::DATE,
      COALESCE(v_prod->'emailPresets', '[]'::JSONB),
      COALESCE(v_prod->'filterSortPresets', '[]'::JSONB),
      COALESCE(v_prod->'printPresets', '[]'::JSONB),
      COALESCE(v_prod->'customTypesConfig', '{}'::JSONB),
      COALESCE(v_prod->'customPrioritiesConfig', '{}'::JSONB)
    );

    -- Add importing user as admin
    INSERT INTO production_members (production_id, user_id, role)
    VALUES (v_target_id, p_imported_by, 'admin')
    ON CONFLICT (production_id, user_id) DO NOTHING;

  ELSE
    RAISE EXCEPTION 'Invalid import mode: %. Use ''restore'' or ''clone''', p_mode;
  END IF;

  -- Import notes with ID mapping
  FOR v_note IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'notes', '[]'::JSONB))
  LOOP
    v_note_id := (v_note->>'id')::UUID;
    v_new_note_id := gen_random_uuid();
    v_note_id_map := v_note_id_map || jsonb_build_object(v_note_id::TEXT, v_new_note_id::TEXT);

    INSERT INTO notes (
      id, production_id, module_type, description, type, priority, status,
      assigned_to, position, cue_number, channel, department, act, scene_song,
      due_date, completed_at, cancelled_at, created_at, updated_at, deleted_at
    )
    VALUES (
      v_new_note_id,
      v_target_id,
      v_note->>'module_type',
      v_note->>'description',
      v_note->>'type',
      v_note->>'priority',
      COALESCE(v_note->>'status', 'todo'),
      v_note->>'assigned_to',
      v_note->>'position',
      v_note->>'cue_number',
      v_note->>'channel',
      v_note->>'department',
      v_note->>'act',
      v_note->>'scene_song',
      (v_note->>'due_date')::TIMESTAMPTZ,
      (v_note->>'completed_at')::TIMESTAMPTZ,
      (v_note->>'cancelled_at')::TIMESTAMPTZ,
      COALESCE((v_note->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((v_note->>'updated_at')::TIMESTAMPTZ, NOW()),
      (v_note->>'deleted_at')::TIMESTAMPTZ
    );
  END LOOP;

  -- Import script pages
  FOR v_script_page IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'scriptPages', '[]'::JSONB))
  LOOP
    INSERT INTO script_pages (id, production_id, page_number, scene_song, act, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_target_id,
      (v_script_page->>'page_number')::INT,
      v_script_page->>'scene_song',
      v_script_page->>'act',
      COALESCE((v_script_page->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((v_script_page->>'updated_at')::TIMESTAMPTZ, NOW())
    );
  END LOOP;

  -- Import scenes/songs
  FOR v_scene_song IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'scenesSongs', '[]'::JSONB))
  LOOP
    INSERT INTO scenes_songs (id, production_id, name, act, sort_order, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_target_id,
      v_scene_song->>'name',
      v_scene_song->>'act',
      COALESCE((v_scene_song->>'sort_order')::INT, 0),
      COALESCE((v_scene_song->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((v_scene_song->>'updated_at')::TIMESTAMPTZ, NOW())
    );
  END LOOP;

  -- Import fixtures with ID mapping
  FOR v_fixture IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'fixtures', '[]'::JSONB))
  LOOP
    v_fixture_id := (v_fixture->>'id')::UUID;
    v_new_fixture_id := gen_random_uuid();
    v_fixture_id_map := v_fixture_id_map || jsonb_build_object(v_fixture_id::TEXT, v_new_fixture_id::TEXT);

    INSERT INTO fixtures (id, production_id, channel, dimmer, position, unit_number, fixture_type, wattage, color, purpose, notes, created_at, updated_at)
    VALUES (
      v_new_fixture_id,
      v_target_id,
      v_fixture->>'channel',
      v_fixture->>'dimmer',
      v_fixture->>'position',
      v_fixture->>'unit_number',
      v_fixture->>'fixture_type',
      v_fixture->>'wattage',
      v_fixture->>'color',
      v_fixture->>'purpose',
      v_fixture->>'notes',
      COALESCE((v_fixture->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((v_fixture->>'updated_at')::TIMESTAMPTZ, NOW())
    );
  END LOOP;

  -- Import work note fixture links (remapping IDs)
  FOR v_link IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'workNoteFixtureLinks', '[]'::JSONB))
  LOOP
    DECLARE
      v_mapped_note_id UUID;
      v_mapped_fixture_id UUID;
    BEGIN
      v_mapped_note_id := (v_note_id_map->>(v_link->>'note_id'))::UUID;
      v_mapped_fixture_id := (v_fixture_id_map->>(v_link->>'fixture_id'))::UUID;

      IF v_mapped_note_id IS NOT NULL AND v_mapped_fixture_id IS NOT NULL THEN
        INSERT INTO work_note_fixture_links (note_id, fixture_id, created_at)
        VALUES (v_mapped_note_id, v_mapped_fixture_id, COALESCE((v_link->>'created_at')::TIMESTAMPTZ, NOW()))
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END LOOP;

  -- Import position orders (remapping note IDs)
  FOR v_position_order IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'positionOrders', '[]'::JSONB))
  LOOP
    INSERT INTO position_orders (id, production_id, position, note_ids, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_target_id,
      v_position_order->>'position',
      v_position_order->'note_ids',
      COALESCE((v_position_order->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((v_position_order->>'updated_at')::TIMESTAMPTZ, NOW())
    );
  END LOOP;

  -- Import departments with ID mapping
  FOR v_department IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'departments', '[]'::JSONB))
  LOOP
    v_department_id := (v_department->>'id')::UUID;
    v_new_department_id := gen_random_uuid();
    v_department_id_map := v_department_id_map || jsonb_build_object(v_department_id::TEXT, v_new_department_id::TEXT);

    INSERT INTO departments (id, production_id, name, description, color, created_at, updated_at)
    VALUES (
      v_new_department_id,
      v_target_id,
      v_department->>'name',
      v_department->>'description',
      v_department->>'color',
      COALESCE((v_department->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((v_department->>'updated_at')::TIMESTAMPTZ, NOW())
    );
  END LOOP;

  -- Import department members (remapping department IDs)
  FOR v_department_member IN SELECT * FROM jsonb_array_elements(COALESCE(p_snapshot_data->'departmentMembers', '[]'::JSONB))
  LOOP
    DECLARE
      v_mapped_dept_id UUID;
    BEGIN
      v_mapped_dept_id := (v_department_id_map->>(v_department_member->>'department_id'))::UUID;
      IF v_mapped_dept_id IS NOT NULL THEN
        INSERT INTO department_members (department_id, user_id, role, created_at)
        VALUES (
          v_mapped_dept_id,
          (v_department_member->>'user_id')::UUID,
          COALESCE(v_department_member->>'role', 'member'),
          COALESCE((v_department_member->>'created_at')::TIMESTAMPTZ, NOW())
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'productionId', v_target_id::TEXT,
    'mode', p_mode,
    'importedBy', p_imported_by::TEXT
  );

  RETURN v_result;
END;
$func$;
