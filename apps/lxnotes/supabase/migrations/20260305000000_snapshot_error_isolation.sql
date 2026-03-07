-- ============================================
-- SNAPSHOT ERROR ISOLATION
-- ============================================
-- Replaces create_scheduled_snapshots() so that each production's
-- export+insert is wrapped in its own BEGIN...EXCEPTION block.
-- One production failing no longer rolls back the entire batch.
-- Returns JSONB: { created, errors, snapshot_ids }

-- Drop old function (return type changed from INTEGER to JSONB)
DROP FUNCTION IF EXISTS create_scheduled_snapshots();

CREATE OR REPLACE FUNCTION create_scheduled_snapshots()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prod RECORD;
  v_snapshot_data JSONB;
  v_entity_counts JSONB;
  v_snapshot_id UUID;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_snapshot_ids UUID[] := '{}';
  v_recent_exists BOOLEAN;
BEGIN
  -- Iterate all active productions (non-demo, non-deleted)
  FOR v_prod IN
    SELECT id, name
    FROM productions
    WHERE is_demo = FALSE
      AND deleted_at IS NULL
  LOOP
    -- Each production is isolated: failure here won't affect others
    BEGIN
      -- Skip if a snapshot already exists within the last 20 hours (dedup safety for daily cadence)
      SELECT EXISTS (
        SELECT 1
        FROM production_snapshots
        WHERE production_id = v_prod.id
          AND created_at > NOW() - INTERVAL '20 hours'
      ) INTO v_recent_exists;

      IF v_recent_exists THEN
        CONTINUE;
      END IF;

      -- Export current production state
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
      )
      RETURNING id INTO v_snapshot_id;

      v_success_count := v_success_count + 1;
      v_snapshot_ids := array_append(v_snapshot_ids, v_snapshot_id);

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE WARNING 'Failed to create scheduled snapshot for production % (%): %',
        v_prod.name, v_prod.id, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'created', v_success_count,
    'errors', v_error_count,
    'snapshot_ids', to_jsonb(v_snapshot_ids)
  );
END;
$$;

COMMENT ON FUNCTION create_scheduled_snapshots IS 'Creates daily auto-snapshots for all active productions with per-production error isolation. Returns JSONB { created, errors, snapshot_ids }.';

-- Restrict execution to service_role only
REVOKE EXECUTE ON FUNCTION public.create_scheduled_snapshots() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_scheduled_snapshots() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_scheduled_snapshots() TO service_role;
