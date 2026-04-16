-- Fix attempt 1 (partial): create_production_snapshot recreation + explicit GRANTs.
--
-- This migration was a first-pass fix for a 42725 ambiguous-function error
-- observed from authenticated clients. It was based on the assumption that
-- `create_production_snapshot` itself had duplicate overloads. Running the
-- migration dropped and recreated that function but did NOT fix the error.
--
-- The real root cause turned out to be a duplicate overload on
-- `export_production_snapshot` (which `create_production_snapshot` calls
-- internally). See 20260415100000_fix_export_production_snapshot_ambiguity.sql
-- for the actual fix.
--
-- This migration is kept as a no-op CREATE OR REPLACE so the history is
-- reproducible from scratch. It does no harm.

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
  IF NOT has_production_access(auth.uid(), p_production_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of this production';
  END IF;

  v_snapshot_data := export_production_snapshot(p_production_id);
  v_entity_counts := v_snapshot_data->'counts';

  INSERT INTO production_snapshots (production_id, snapshot_data, trigger_reason, created_by, note, entity_counts)
  VALUES (p_production_id, v_snapshot_data, p_trigger_reason, auth.uid(), p_note, v_entity_counts)
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_production_snapshot(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_production_snapshot(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_production_snapshot(UUID, TEXT, UUID, TEXT) TO service_role;
