-- ============================================
-- SNAPSHOT STORAGE BUCKET
-- ============================================
-- Creates a private Supabase Storage bucket for off-site snapshot backups.
-- Supabase Storage is S3-backed, separate infrastructure from Postgres.
-- All access is through service_role (bypasses storage RLS), so no policies needed.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'production-snapshots',
  'production-snapshots',
  false,
  52428800,  -- 50MB, matches MAX_SNAPSHOT_SIZE
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;
