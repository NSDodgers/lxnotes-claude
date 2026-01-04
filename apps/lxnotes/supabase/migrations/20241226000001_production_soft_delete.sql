-- Add soft-delete support to productions table
-- Productions moved to trash will have deleted_at set
-- After 30 days, a cleanup job will permanently delete them

-- Add soft-delete columns
ALTER TABLE productions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create index for efficient filtering of active vs deleted productions
CREATE INDEX IF NOT EXISTS idx_productions_deleted_at ON productions(deleted_at);

-- Create cleanup function for 30-day retention
-- Uses SECURITY DEFINER with empty search_path to prevent search_path injection
CREATE OR REPLACE FUNCTION public.cleanup_deleted_productions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.productions
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Note: To schedule automatic cleanup with pg_cron (if available):
-- SELECT cron.schedule('cleanup-deleted-productions', '0 0 * * *', 'SELECT cleanup_deleted_productions()');
