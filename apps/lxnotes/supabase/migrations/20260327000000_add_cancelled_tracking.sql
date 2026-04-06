-- Add cancelled tracking columns to notes table
-- Tracks who cancelled a note and when, mirroring completed_by/completed_at pattern

ALTER TABLE notes ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
