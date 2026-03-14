-- Fix "Function Search Path Mutable" security warnings
-- Sets search_path on functions that were missing it

-- Fix generate_production_short_code
CREATE OR REPLACE FUNCTION public.generate_production_short_code()
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
      bytes := gen_random_bytes(6);
      new_code := '';

      FOR i IN 0..5 LOOP
        idx := get_byte(bytes, i) % 36;
        new_code := new_code || substr(chars, idx + 1, 1);
      END LOOP;

      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.productions WHERE short_code = new_code);

      attempts := attempts + 1;
      IF attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique short code after 10 attempts';
      END IF;
    END LOOP;

    NEW.short_code := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix get_linked_production
CREATE OR REPLACE FUNCTION public.get_linked_production(
  p_production_id UUID,
  p_target_app_id TEXT
)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT target_production_id
    FROM public.production_links
    WHERE source_production_id = p_production_id
      AND target_app_id = p_target_app_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
