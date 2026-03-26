-- Add 'deleted' to the notes status CHECK constraint
-- Soft delete: notes marked as deleted remain in the system but are only visible
-- when the "Deleted" filter tab is selected

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_status_check;
ALTER TABLE notes ADD CONSTRAINT notes_status_check
  CHECK (status IN ('todo', 'review', 'complete', 'cancelled', 'deleted'));
