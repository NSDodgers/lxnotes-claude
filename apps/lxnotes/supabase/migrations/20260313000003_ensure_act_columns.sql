-- Ensure act columns exist on script_pages
-- Migration 20260313000000 was recorded but columns may not have been created
ALTER TABLE script_pages ADD COLUMN IF NOT EXISTS act_name TEXT DEFAULT NULL;
ALTER TABLE script_pages ADD COLUMN IF NOT EXISTS act_first_cue_number TEXT DEFAULT NULL;
