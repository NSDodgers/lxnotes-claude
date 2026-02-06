-- Add custom types and priorities config columns to productions table
-- These store per-production custom types and priorities as JSONB blobs
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS custom_types_config JSONB DEFAULT '{"customTypes":{"cue":[],"work":[],"production":[],"actor":[]},"systemOverrides":[]}',
ADD COLUMN IF NOT EXISTS custom_priorities_config JSONB DEFAULT '{"customPriorities":{"cue":[],"work":[],"production":[],"actor":[]},"systemOverrides":[]}';

COMMENT ON COLUMN productions.custom_types_config IS 'Per-production custom note types and system overrides per module';
COMMENT ON COLUMN productions.custom_priorities_config IS 'Per-production custom priorities and system overrides per module';
