-- Add saved_recipients column to productions table
-- Stores email addresses that users frequently send notes to
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS saved_recipients text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN productions.saved_recipients IS 'Array of email addresses saved for quick access when sending notes';
