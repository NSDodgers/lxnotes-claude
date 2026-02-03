-- Add preset columns to productions table
-- These store filter/sort, page style, and print presets configured for each production
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS filter_sort_presets JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS page_style_presets JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS print_presets JSONB DEFAULT '[]';

COMMENT ON COLUMN productions.filter_sort_presets IS 'Array of filter/sort preset configurations';
COMMENT ON COLUMN productions.page_style_presets IS 'Array of page style preset configurations';
COMMENT ON COLUMN productions.print_presets IS 'Array of print preset configurations';
