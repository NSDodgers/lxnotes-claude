-- Fix search_path security warnings for SECURITY DEFINER functions
-- See: https://supabase.com/docs/guides/database/functions#search_path
--
-- The search_path should be set to empty string for SECURITY DEFINER functions
-- to prevent search_path injection attacks.

-- Fix cleanup_deleted_productions function
-- Recreate with explicit schema references and secure search_path
CREATE OR REPLACE FUNCTION public.cleanup_deleted_productions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.productions
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix broadcast_production_changes function (if it exists)
-- Use ALTER FUNCTION to set search_path without changing function logic
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'broadcast_production_changes'
  ) THEN
    ALTER FUNCTION public.broadcast_production_changes() SET search_path = '';
  END IF;
END $$;
