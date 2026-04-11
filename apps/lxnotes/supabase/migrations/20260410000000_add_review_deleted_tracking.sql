-- Add review tracking columns (who marked a note for review and when)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add deleted-by-name tracking (separate from soft-delete deleted_by UUID)
-- deleted_by stores the auth user UUID for infrastructure; deleted_by_name stores display name for UI
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_by_name TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS status_deleted_at TIMESTAMPTZ;
