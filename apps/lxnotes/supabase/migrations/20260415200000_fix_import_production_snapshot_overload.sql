-- Fix: drop orphaned import_production_snapshot overload
--
-- Context: migration 20260401000000_inline_page_style_config.sql:258 used
--   CREATE OR REPLACE FUNCTION import_production_snapshot(jsonb, uuid, uuid, text)
-- This is the same latent-overload pattern that caused #70: the signature
-- differs from the pre-existing (uuid, jsonb, text, uuid) version defined in
-- 20260212000000_production_snapshot_import.sql, so PG added a SECOND
-- overload instead of replacing. Both live in the DB today.
--
-- Unlike #70, this one doesn't fire 42725 because callers use named
-- parameters and the two overloads have disjoint param names, so
-- PostgREST can resolve uniquely. But:
-- 1. It's confusing — which overload did migration 20260401 intend?
-- 2. No caller uses the new overload's param names anywhere outside
--    the migration files, so it's effectively dead code.
-- 3. The regression test in tests/unit/supabase/migration-function-
--    signatures.test.ts (added alongside this migration) will flag this
--    as a bug to prevent future recurrence.
--
-- Fix: drop the orphaned (jsonb, uuid, uuid, text) overload. Keep the
-- (uuid, jsonb, text, uuid) version that callers actually use.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'import_production_snapshot'
      AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'p_snapshot_data jsonb, p_imported_by uuid, p_target_production_id uuid, p_mode text'
  LOOP
    RAISE NOTICE 'Dropping orphaned overload: public.import_production_snapshot(%)', rec.args;
    EXECUTE format('DROP FUNCTION public.import_production_snapshot(%s)', rec.args);
  END LOOP;
END $$;

-- Sanity check: exactly one overload should remain.
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'import_production_snapshot' AND n.nspname = 'public';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 overload of import_production_snapshot, found %', v_count;
  END IF;
END $$;
