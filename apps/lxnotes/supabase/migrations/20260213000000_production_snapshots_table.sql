-- ============================================
-- TABLE: PRODUCTION_SNAPSHOTS
-- ============================================
-- Stores server-side snapshots for auto-backup and manual checkpoints

CREATE TABLE production_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  trigger_reason TEXT NOT NULL CHECK (trigger_reason IN (
    'manual', 'before_restore', 'before_fixture_import', 'before_script_replace'
  )),
  created_by UUID REFERENCES auth.users(id),
  note TEXT,
  entity_counts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_snapshots_production_created
  ON production_snapshots(production_id, created_at DESC);

-- Enable RLS
ALTER TABLE production_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_snapshots FORCE ROW LEVEL SECURITY;

-- RLS: Members can read snapshots
CREATE POLICY "Members can read production snapshots" ON production_snapshots
  FOR SELECT TO authenticated USING (
    (SELECT has_production_access((SELECT auth.uid()), production_id))
  );

-- RLS: Admins can insert snapshots
CREATE POLICY "Admins can create production snapshots" ON production_snapshots
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT is_production_admin((SELECT auth.uid()), production_id))
  );

-- RLS: Admins can delete snapshots
CREATE POLICY "Admins can delete production snapshots" ON production_snapshots
  FOR DELETE TO authenticated USING (
    (SELECT is_production_admin((SELECT auth.uid()), production_id))
  );

COMMENT ON TABLE production_snapshots IS 'Server-side production snapshots for backup, auto-snapshots before destructive operations, and manual checkpoints';

-- ============================================
-- FUNCTION: CREATE PRODUCTION SNAPSHOT
-- ============================================
-- Creates a snapshot by calling export_production_snapshot internally
-- Enforces retention limit of 20 per production

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

  -- Enforce retention: delete oldest beyond 20 per production
  DELETE FROM production_snapshots
  WHERE id IN (
    SELECT id FROM production_snapshots
    WHERE production_id = p_production_id
    ORDER BY created_at DESC
    OFFSET 20
  );

  RETURN v_snapshot_id;
END;
$$;

COMMENT ON FUNCTION create_production_snapshot IS 'Creates a server-side snapshot with automatic retention enforcement (max 20 per production)';

-- ============================================
-- FUNCTION: CLEANUP OLD SNAPSHOTS
-- ============================================
-- Global cleanup: enforce 20-snapshot limit across all productions

CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_prod_id UUID;
  v_count INTEGER;
BEGIN
  -- Find productions with more than 20 snapshots
  FOR v_prod_id IN
    SELECT production_id
    FROM production_snapshots
    GROUP BY production_id
    HAVING COUNT(*) > 20
  LOOP
    DELETE FROM production_snapshots
    WHERE id IN (
      SELECT id FROM production_snapshots
      WHERE production_id = v_prod_id
      ORDER BY created_at DESC
      OFFSET 20
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted + v_count;
  END LOOP;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION cleanup_old_snapshots IS 'Enforces 20-snapshot retention limit across all productions, returns count of deleted snapshots';
