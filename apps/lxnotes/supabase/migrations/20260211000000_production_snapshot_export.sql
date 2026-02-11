-- ============================================
-- FUNCTION: EXPORT PRODUCTION SNAPSHOT
-- ============================================
-- Exports all production-scoped data as a single JSONB snapshot
-- Used for backup, restore, and clone operations

CREATE OR REPLACE FUNCTION export_production_snapshot(p_production_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_production RECORD;
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
BEGIN
  -- Lock production row for consistent read
  SELECT * INTO v_production
  FROM productions
  WHERE id = p_production_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production not found: %', p_production_id;
  END IF;

  -- Verify caller has access to this production
  IF NOT has_production_access(auth.uid(), p_production_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of this production';
  END IF;

  -- Gather notes (including soft-deleted)
  SELECT COALESCE(jsonb_agg(to_jsonb(n)), '[]'::JSONB)
  INTO v_notes
  FROM notes n
  WHERE n.production_id = p_production_id;

  -- Gather script pages
  SELECT COALESCE(jsonb_agg(to_jsonb(sp)), '[]'::JSONB)
  INTO v_script_pages
  FROM script_pages sp
  WHERE sp.production_id = p_production_id;

  -- Gather scenes/songs
  SELECT COALESCE(jsonb_agg(to_jsonb(ss)), '[]'::JSONB)
  INTO v_scenes_songs
  FROM scenes_songs ss
  WHERE ss.production_id = p_production_id;

  -- Gather fixtures
  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::JSONB)
  INTO v_fixtures
  FROM fixtures f
  WHERE f.production_id = p_production_id;

  -- Gather work note fixture links (join through notes to scope by production)
  SELECT COALESCE(jsonb_agg(to_jsonb(wfl)), '[]'::JSONB)
  INTO v_work_note_fixture_links
  FROM work_note_fixture_links wfl
  INNER JOIN notes n ON n.id = wfl.work_note_id
  WHERE n.production_id = p_production_id;

  -- Gather position orders
  SELECT COALESCE(jsonb_agg(to_jsonb(po)), '[]'::JSONB)
  INTO v_position_orders
  FROM position_orders po
  WHERE po.production_id = p_production_id;

  -- Gather departments
  SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::JSONB)
  INTO v_departments
  FROM departments d
  WHERE d.production_id = p_production_id;

  -- Gather department members (join through departments to scope by production)
  SELECT COALESCE(jsonb_agg(to_jsonb(dm)), '[]'::JSONB)
  INTO v_department_members
  FROM department_members dm
  INNER JOIN departments d ON d.id = dm.department_id
  WHERE d.production_id = p_production_id;

  -- Gather members (reference only - email, name, role)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'userId', pm.user_id,
    'email', u.email,
    'fullName', u.full_name,
    'role', pm.role
  )), '[]'::JSONB)
  INTO v_members
  FROM production_members pm
  INNER JOIN users u ON u.id = pm.user_id
  WHERE pm.production_id = p_production_id;

  -- Build counts
  v_counts := jsonb_build_object(
    'notes', jsonb_array_length(v_notes),
    'activeNotes', (SELECT COUNT(*) FROM notes WHERE production_id = p_production_id AND deleted_at IS NULL),
    'deletedNotes', (SELECT COUNT(*) FROM notes WHERE production_id = p_production_id AND deleted_at IS NOT NULL),
    'fixtures', jsonb_array_length(v_fixtures),
    'scriptPages', jsonb_array_length(v_script_pages),
    'scenesSongs', jsonb_array_length(v_scenes_songs),
    'workNoteFixtureLinks', jsonb_array_length(v_work_note_fixture_links),
    'departments', jsonb_array_length(v_departments),
    'members', jsonb_array_length(v_members)
  );

  -- Build and return snapshot
  RETURN jsonb_build_object(
    'version', 1,
    'exportedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'productionId', p_production_id,
    'productionName', v_production.name,
    'production', jsonb_build_object(
      'name', v_production.name,
      'abbreviation', v_production.abbreviation,
      'logo', v_production.logo,
      'description', v_production.description,
      'startDate', v_production.start_date,
      'endDate', v_production.end_date,
      'shortCode', v_production.short_code,
      'emailPresets', COALESCE(v_production.email_presets, '[]'::JSONB),
      'filterSortPresets', COALESCE(v_production.filter_sort_presets, '[]'::JSONB),
      'pageStylePresets', COALESCE(v_production.page_style_presets, '[]'::JSONB),
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
END;
$$;

COMMENT ON FUNCTION export_production_snapshot IS 'Exports all production-scoped data as a JSONB snapshot for backup/restore/clone';
