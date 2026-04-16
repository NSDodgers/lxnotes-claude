-- Fix: export_production_snapshot ambiguous-function error (PG 42725)
--
-- Symptom: authenticated clients get 42725 "Could not choose a best
--   candidate function" with message
--   "function export_production_snapshot(uuid) is not unique".
--   The error surfaces as a generic "Cannot import fixtures: failed to
--   create safety snapshot" in the browser because
--   create_production_snapshot catches-and-rethrows.
--
-- Impact: CSV hookup imports fail to persist to Supabase. Local Zustand
--   store shows the imported fixtures (UI says "Import Successful"), but
--   Supabase has zero rows. Any subsequent action that triggers a
--   re-fetch wipes the local store via syncFixtures(productionId, []).
--   FixtureSelector becomes empty, work notes can't be assigned to
--   fixtures. See bug report 2026-04-15.
--
-- Root cause: migration 20260401000000_inline_page_style_config.sql:116
--   used CREATE OR REPLACE FUNCTION export_production_snapshot with a
--   new 4-arg signature:
--     (uuid, uuid DEFAULT NULL, text DEFAULT 'manual', text DEFAULT NULL)
--   Because this signature differs from the pre-existing 1-arg version
--   from 20260211000000_production_snapshot_export.sql:7, PG added a
--   SECOND overload instead of replacing. Calling with one argument now
--   matches both candidates (the 4-arg via its defaults), producing
--   42725 ambiguous_function.
--
-- Fix: drop the stale 1-arg overload. The 4-arg version handles the
--   1-arg call pattern via defaults and is the current definition.
--   Verify via count check that exactly one overload remains.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'export_production_snapshot'
      AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'p_production_id uuid'
  LOOP
    RAISE NOTICE 'Dropping stale 1-arg overload: public.export_production_snapshot(%)', rec.args;
    EXECUTE format('DROP FUNCTION public.export_production_snapshot(%s)', rec.args);
  END LOOP;
END $$;

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'export_production_snapshot' AND n.nspname = 'public';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 overload of export_production_snapshot after fix, found %', v_count;
  END IF;
END $$;
