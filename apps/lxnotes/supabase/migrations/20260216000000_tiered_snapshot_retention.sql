-- ============================================
-- TIERED SNAPSHOT RETENTION POLICY
-- ============================================
-- Replaces the flat 20-snapshot cap with time-based tiered retention:
--
--   Tier 1 (0-14 days):  Keep ALL snapshots (no pruning)
--   Tier 2 (15-90 days): Keep 1 per day (latest that day), but exempt manual snapshots
--   Tier 3 (90+ days):   Delete everything
--
-- Manual snapshots (trigger_reason = 'manual') are exempt from Tier 2 thinning
-- and only deleted when they reach the 90-day hard expiry.

-- ── Update create_production_snapshot: remove inline count-based pruning ──

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

  -- Insert snapshot
  INSERT INTO production_snapshots (production_id, snapshot_data, trigger_reason, created_by, note, entity_counts)
  VALUES (p_production_id, v_snapshot_data, p_trigger_reason, p_created_by, p_note, v_entity_counts)
  RETURNING id INTO v_snapshot_id;

  -- Retention is now handled by the daily cron via cleanup_old_snapshots()
  -- No inline pruning here

  RETURN v_snapshot_id;
END;
$$;

COMMENT ON FUNCTION create_production_snapshot IS 'Creates a server-side snapshot. Retention enforced by daily cron (tiered: 14d full, 90d thinned, then expired).';


-- ── Replace cleanup_old_snapshots with tiered retention ──

CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_count INTEGER;
BEGIN
  -- ────────────────────────────────────────────
  -- TIER 3: Delete everything older than 90 days
  -- ────────────────────────────────────────────
  DELETE FROM production_snapshots
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- ────────────────────────────────────────────
  -- TIER 2: Thin days 15-90 to 1 per day
  --         Keep the latest snapshot per (production, day)
  --         Exempt manual snapshots from thinning
  -- ────────────────────────────────────────────
  DELETE FROM production_snapshots
  WHERE id IN (
    SELECT id FROM (
      SELECT
        id,
        trigger_reason,
        ROW_NUMBER() OVER (
          PARTITION BY production_id, DATE(created_at)
          ORDER BY created_at DESC
        ) AS rn
      FROM production_snapshots
      WHERE created_at < NOW() - INTERVAL '14 days'
        AND created_at >= NOW() - INTERVAL '90 days'
    ) ranked
    -- Delete if not the latest that day AND not a manual snapshot
    WHERE ranked.rn > 1
      AND ranked.trigger_reason != 'manual'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- ────────────────────────────────────────────
  -- TIER 1: 0-14 days — keep everything (no action)
  -- ────────────────────────────────────────────

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION cleanup_old_snapshots IS 'Tiered snapshot retention: 0-14d keep all, 15-90d keep 1/day (manual exempt), 90d+ delete. Returns count of deleted snapshots.';
