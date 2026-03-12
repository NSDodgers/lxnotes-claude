-- Add act columns to script_pages
-- Acts are a property of pages in the hierarchy: Page > Act > Scene/Song
-- The act name persists across pages via the CSV import continuation logic

ALTER TABLE script_pages ADD COLUMN act_name TEXT DEFAULT NULL;
ALTER TABLE script_pages ADD COLUMN act_first_cue_number TEXT DEFAULT NULL;

-- Update replace_script_pages RPC to include act fields
CREATE OR REPLACE FUNCTION replace_script_pages(
  p_production_id UUID,
  p_pages JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing pages for this production
  DELETE FROM script_pages
  WHERE production_id = p_production_id;

  -- Insert new pages (if any)
  IF jsonb_array_length(p_pages) > 0 THEN
    INSERT INTO script_pages (id, production_id, page_number, first_cue_number, act_name, act_first_cue_number)
    SELECT
      COALESCE((elem->>'id')::UUID, gen_random_uuid()),
      p_production_id,
      elem->>'page_number',
      elem->>'first_cue_number',
      elem->>'act_name',
      elem->>'act_first_cue_number'
    FROM jsonb_array_elements(p_pages) AS elem;
  END IF;
END;
$$;
