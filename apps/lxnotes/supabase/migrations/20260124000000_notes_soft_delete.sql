-- Add soft-delete support to notes table
-- Notes soft-deleted will have deleted_at set
-- After 90 days, a cleanup job will permanently delete them

-- Add soft-delete columns
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create index for efficient filtering of active vs deleted notes
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);

-- Create cleanup function for 90-day retention
-- Uses SECURITY DEFINER with empty search_path to prevent search_path injection
CREATE OR REPLACE FUNCTION public.cleanup_deleted_notes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notes
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke execute from public - only service_role/postgres should call this
REVOKE EXECUTE ON FUNCTION public.cleanup_deleted_notes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_deleted_notes() TO service_role;