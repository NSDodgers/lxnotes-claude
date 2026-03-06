-- ============================================
-- SCHEDULED AUTO-SNAPSHOTS
-- ============================================
-- Adds 'scheduled' as a valid trigger_reason and creates a function
-- that iterates all active productions and creates snapshots for each.
-- Called by the /api/cron/auto-snapshot endpoint every 6 hours.

-- ── 1. Add 'scheduled' to trigger_reason CHECK constraint ──

ALTER TABLE production_snapshots
  DROP CONSTRAINT IF EXISTS production_snapshots_trigger_reason_check;

ALTER TABLE production_snapshots
  ADD CONSTRAINT production_snapshots_trigger_reason_check
  CHECK (trigger_reason IN (
    'manual', 'before_restore', 'before_fixture_import', 'before_script_replace', 'scheduled'
  ));

-- ── 2. Internal export function (no auth check, for server-side use only) ──
-- export_production_snapshot checks auth.uid() which is NULL in cron context.
-- This internal version skips that check and is only callable by service_role.

CREATE OR REPLACE FUNCTION _export_production_snapshot_internal(p_production_id UUID)
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
  SELECT * INTO v_production
  FROM productions
  WHERE id = p_production_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production not found: %', p_production_id;
  END IF;

  -- No auth check — this function is restricted to service_role

  SELECT COALESCE(jsonb_agg(to_jsonb(n)), '[]'::JSONB) INTO v_notes
  FROM notes n WHERE n.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(sp)), '[]'::JSONB) INTO v_script_pages
  FROM script_pages sp WHERE sp.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(ss)), '[]'::JSONB) INTO v_scenes_songs
  FROM scenes_songs ss WHERE ss.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::JSONB) INTO v_fixtures
  FROM fixtures f WHERE f.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(wfl)), '[]'::JSONB) INTO v_work_note_fixture_links
  FROM work_note_fixture_links wfl
  INNER JOIN notes n ON n.id = wfl.work_note_id
  WHERE n.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(po)), '[]'::JSONB) INTO v_position_orders
  FROM position_orders po WHERE po.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::JSONB) INTO v_departments
  FROM departments d WHERE d.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(dm)), '[]'::JSONB) INTO v_department_members
  FROM department_members dm
  INNER JOIN departments d ON d.id = dm.department_id
  WHERE d.production_id = p_production_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'userId', pm.user_id, 'email', u.email, 'fullName', u.full_name, 'role', pm.role
  )), '[]'::JSONB) INTO v_members
  FROM production_members pm
  INNER JOIN users u ON u.id = pm.user_id
  WHERE pm.production_id = p_production_id;

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

COMMENT ON FUNCTION _export_production_snapshot_internal IS 'Internal export function for server-side use (no auth check). Restricted to service_role.';

REVOKE EXECUTE ON FUNCTION public._export_production_snapshot_internal(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._export_production_snapshot_internal(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._export_production_snapshot_internal(UUID) TO service_role;

-- ── 3. Create scheduled snapshot function ──

CREATE OR REPLACE FUNCTION create_scheduled_snapshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prod RECORD;
  v_snapshot_data JSONB;
  v_entity_counts JSONB;
  v_count INTEGER := 0;
  v_recent_exists BOOLEAN;
BEGIN
  -- Iterate all active productions (non-demo, non-deleted)
  FOR v_prod IN
    SELECT id, name
    FROM productions
    WHERE is_demo = FALSE
      AND deleted_at IS NULL
  LOOP
    -- Skip if a snapshot already exists within the last 4 hours (dedup safety)
    SELECT EXISTS (
      SELECT 1
      FROM production_snapshots
      WHERE production_id = v_prod.id
        AND created_at > NOW() - INTERVAL '4 hours'
    ) INTO v_recent_exists;

    IF v_recent_exists THEN
      CONTINUE;
    END IF;

    -- Export current production state (using internal version that skips auth check)
    v_snapshot_data := _export_production_snapshot_internal(v_prod.id);

    -- Extract counts
    v_entity_counts := v_snapshot_data->'counts';

    -- Insert snapshot
    INSERT INTO production_snapshots (
      production_id, snapshot_data, trigger_reason, created_by, note, entity_counts
    )
    VALUES (
      v_prod.id,
      v_snapshot_data,
      'scheduled',
      NULL,
      'Scheduled auto-snapshot',
      v_entity_counts
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION create_scheduled_snapshots IS 'Creates auto-snapshots for all active productions. Called by cron every 6 hours. Skips productions with a snapshot in the last 4 hours.';

-- Restrict execution to service_role only
REVOKE EXECUTE ON FUNCTION public.create_scheduled_snapshots() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_scheduled_snapshots() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_scheduled_snapshots() TO service_role;
