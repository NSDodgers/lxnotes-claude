-- Ensure replace_script_pages RPC includes act fields
-- Migration 20260313000000 may not have applied the function update
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
