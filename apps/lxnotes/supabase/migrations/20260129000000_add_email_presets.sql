-- Add email_presets column to productions table
-- Stores email message presets configured for this production
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS email_presets JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN productions.email_presets IS 'Array of email message preset configurations for this production';
