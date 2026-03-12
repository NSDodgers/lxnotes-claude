-- Add 'review' to the notes status CHECK constraint
-- This new status is used by work notes for design team review workflow

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_status_check;
ALTER TABLE notes ADD CONSTRAINT notes_status_check
  CHECK (status IN ('todo', 'review', 'complete', 'cancelled'));
