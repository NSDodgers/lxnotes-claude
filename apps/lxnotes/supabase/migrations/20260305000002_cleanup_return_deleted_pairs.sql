-- ============================================
-- CLEANUP RETURN DELETED PAIRS
-- ============================================
-- Updates cleanup_old_snapshots() to return JSONB with deleted
-- (production_id, snapshot_id) pairs so the cron route can remove
-- corresponding files from Supabase Storage.

-- Drop old function (return type changed from INTEGER to JSONB)
DROP FUNCTION IF EXISTS cleanup_old_snapshots();

CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_pairs JSONB := '[]'::JSONB;
  v_tier3_pairs JSONB;
  v_tier2_pairs JSONB;
BEGIN
  -- ────────────────────────────────────────────
  -- TIER 3: Delete everything older than 90 days
  -- ────────────────────────────────────────────
  WITH deleted AS (
    DELETE FROM production_snapshots
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING production_id, id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'production_id', production_id,
    'snapshot_id', id
  )), '[]'::JSONB)
  INTO v_tier3_pairs
  FROM deleted;

  -- ────────────────────────────────────────────
  -- TIER 2: Thin days 15-90 to 1 per day
  --         Keep the latest snapshot per (production, day)
  --         Exempt manual snapshots from thinning
  -- ────────────────────────────────────────────
  WITH deleted AS (
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
      WHERE ranked.rn > 1
        AND ranked.trigger_reason != 'manual'
    )
    RETURNING production_id, id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'production_id', production_id,
    'snapshot_id', id
  )), '[]'::JSONB)
  INTO v_tier2_pairs
  FROM deleted;

  -- ────────────────────────────────────────────
  -- TIER 1: 0-14 days — keep everything (no action)
  -- ────────────────────────────────────────────

  -- Combine pairs from both tiers
  v_deleted_pairs := v_tier3_pairs || v_tier2_pairs;

  RETURN jsonb_build_object(
    'deleted_count', jsonb_array_length(v_deleted_pairs),
    'deleted', v_deleted_pairs
  );
END;
$$;

COMMENT ON FUNCTION cleanup_old_snapshots IS 'Tiered snapshot retention: 0-14d keep all, 15-90d keep 1/day (manual exempt), 90d+ delete. Returns JSONB { deleted_count, deleted[] }.';
