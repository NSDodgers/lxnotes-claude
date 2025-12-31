-- Migration: Production Short Codes and Cross-App Linking
-- Purpose: Enable linking separate productions across Director Notes and LX Notes apps

-- ============================================================================
-- 1. Add short_code column to productions table
-- ============================================================================

ALTER TABLE productions
ADD COLUMN short_code VARCHAR(8) UNIQUE;

-- Generate short codes for existing productions
-- Uses first 6 chars of MD5 hash of id + timestamp for uniqueness
UPDATE productions
SET short_code = UPPER(SUBSTRING(MD5(id::TEXT || NOW()::TEXT) FROM 1 FOR 6))
WHERE short_code IS NULL;

-- Create function to auto-generate short codes
CREATE OR REPLACE FUNCTION generate_production_short_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(8);
  attempts INT := 0;
  chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  bytes BYTEA;
  i INT;
  idx INT;
BEGIN
  IF NEW.short_code IS NULL THEN
    LOOP
      -- Generate 6 random bytes
      bytes := gen_random_bytes(6);
      new_code := '';
      
      -- Convert each byte to a char from our alphabet
      FOR i IN 0..5 LOOP
        idx := get_byte(bytes, i) % 36;
        new_code := new_code || substr(chars, idx + 1, 1);
      END LOOP;

      -- Check for collision
      EXIT WHEN NOT EXISTS (SELECT 1 FROM productions WHERE short_code = new_code);

      attempts := attempts + 1;
      IF attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique short code after 10 attempts';
      END IF;
    END LOOP;

    NEW.short_code := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generation
CREATE TRIGGER set_production_short_code
  BEFORE INSERT ON productions
  FOR EACH ROW
  EXECUTE FUNCTION generate_production_short_code();

-- ============================================================================
-- 2. Create production_links table
-- ============================================================================

CREATE TABLE production_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source production (the one being linked FROM)
  source_production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  source_app_id TEXT NOT NULL CHECK (source_app_id IN ('lxnotes', 'director_notes')),

  -- Target production (the one being linked TO - the local production)
  target_production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  target_app_id TEXT NOT NULL CHECK (target_app_id IN ('lxnotes', 'director_notes')),

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate links (in either direction)
  UNIQUE(source_production_id, target_production_id)
);

-- Create index for lookups
CREATE INDEX idx_production_links_source ON production_links(source_production_id);
CREATE INDEX idx_production_links_target ON production_links(target_production_id);

-- ============================================================================
-- 3. RLS Policies for production_links
-- ============================================================================

ALTER TABLE production_links ENABLE ROW LEVEL SECURITY;

-- Users can view links for productions they're members of
CREATE POLICY "Users can view links for their productions"
  ON production_links FOR SELECT
  USING (
    source_production_id IN (
      SELECT production_id FROM production_members WHERE user_id = auth.uid()
    )
    OR target_production_id IN (
      SELECT production_id FROM production_members WHERE user_id = auth.uid()
    )
  );

-- Only admins can create links (for the target production)
CREATE POLICY "Admins can create links"
  ON production_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_members
      WHERE production_id = target_production_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Only admins can delete links
CREATE POLICY "Admins can delete links"
  ON production_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM production_members
      WHERE production_id = target_production_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. Helper function to find linked production
-- ============================================================================

CREATE OR REPLACE FUNCTION get_linked_production(
  p_production_id UUID,
  p_target_app_id TEXT
)
RETURNS UUID AS $$
BEGIN
  -- Look for a link where our production is the source
  -- and the target is in the requested app
  RETURN (
    SELECT target_production_id
    FROM production_links
    WHERE source_production_id = p_production_id
      AND target_app_id = p_target_app_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON production_links TO authenticated;
GRANT EXECUTE ON FUNCTION get_linked_production TO authenticated;
