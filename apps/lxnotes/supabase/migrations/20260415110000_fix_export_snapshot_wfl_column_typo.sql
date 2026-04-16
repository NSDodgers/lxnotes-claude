-- Fix: export_production_snapshot references non-existent column wfl.note_id
--
-- Symptom: calling create_production_snapshot (which calls
--   export_production_snapshot) returns 42703
--   "column wfl.note_id does not exist".
--
-- Root cause: migration 20260401000000_inline_page_style_config.sql
--   introduced a typo in two places inside export_production_snapshot:
--     - line 174: WHERE wfl.note_id IN (...)
--     - line 209: WHERE note_id IN (...)
--   The correct column is `work_note_id` on the `work_note_fixture_links`
--   table (see initial schema 20241214000000:101). The typo went
--   undetected because the old 1-arg overload of
--   export_production_snapshot was still resolvable and had the correct
--   SQL, so many code paths silently dispatched to the old version. Once
--   20260415100000_fix_export_production_snapshot_ambiguity.sql dropped
--   the 1-arg overload, the buggy 4-arg version became the only
--   candidate and 42703 started surfacing.
--
-- Fix: CREATE OR REPLACE the 4-arg function with `work_note_id` in both
--   query sites. The rest of the function body is unchanged from
--   20260401000000_inline_page_style_config.sql:116-253.

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
  SELECT * INTO v_production FROM productions WHERE id = p_production_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production not found or deleted: %', p_production_id;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(n)::JSONB), '[]'::JSONB) INTO v_notes
  FROM notes n WHERE n.production_id = p_production_id;

  SELECT COUNT(*) FILTER (WHERE deleted_at IS NULL), COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
  INTO v_active_note_count, v_deleted_note_count
  FROM notes WHERE production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(row_to_json(sp)::JSONB), '[]'::JSONB) INTO v_script_pages
  FROM script_pages sp WHERE sp.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(row_to_json(ss)::JSONB), '[]'::JSONB) INTO v_scenes_songs
  FROM scenes_songs ss WHERE ss.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(row_to_json(f)::JSONB), '[]'::JSONB) INTO v_fixtures
  FROM fixtures f WHERE f.production_id = p_production_id;

  -- FIX: column is `work_note_id`, not `note_id`
  SELECT COALESCE(jsonb_agg(row_to_json(wfl)::JSONB), '[]'::JSONB) INTO v_work_note_fixture_links
  FROM work_note_fixture_links wfl
  WHERE wfl.work_note_id IN (SELECT id FROM notes WHERE production_id = p_production_id);

  SELECT COALESCE(jsonb_agg(row_to_json(po)::JSONB), '[]'::JSONB) INTO v_position_orders
  FROM position_orders po WHERE po.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(row_to_json(d)::JSONB), '[]'::JSONB) INTO v_departments
  FROM departments d WHERE d.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(row_to_json(dm)::JSONB), '[]'::JSONB) INTO v_department_members
  FROM department_members dm WHERE dm.department_id IN (
    SELECT id FROM departments WHERE production_id = p_production_id
  );

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'userId', pm.user_id,
    'email', u.email,
    'fullName', u.raw_user_meta_data->>'full_name',
    'role', pm.role
  )), '[]'::JSONB) INTO v_members
  FROM production_members pm
  JOIN auth.users u ON u.id = pm.user_id
  WHERE pm.production_id = p_production_id;

  v_counts := jsonb_build_object(
    'notes', (SELECT COUNT(*) FROM notes WHERE production_id = p_production_id),
    'activeNotes', v_active_note_count,
    'deletedNotes', v_deleted_note_count,
    'fixtures', (SELECT COUNT(*) FROM fixtures WHERE production_id = p_production_id),
    'scriptPages', (SELECT COUNT(*) FROM script_pages WHERE production_id = p_production_id),
    'scenesSongs', (SELECT COUNT(*) FROM scenes_songs WHERE production_id = p_production_id),
    -- FIX: column is `work_note_id`, not `note_id`
    'workNoteFixtureLinks', (SELECT COUNT(*) FROM work_note_fixture_links WHERE work_note_id IN (SELECT id FROM notes WHERE production_id = p_production_id)),
    'departments', (SELECT COUNT(*) FROM departments WHERE production_id = p_production_id),
    'members', (SELECT COUNT(*) FROM production_members WHERE production_id = p_production_id)
  );

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

  v_snapshot_id := gen_random_uuid();
  INSERT INTO production_snapshots (id, production_id, snapshot_data, entity_counts, created_by, trigger_reason, note)
  VALUES (v_snapshot_id, p_production_id, v_snapshot, v_counts, p_exported_by, p_trigger_reason, p_note);

  RETURN v_snapshot;
END;
$func$;
