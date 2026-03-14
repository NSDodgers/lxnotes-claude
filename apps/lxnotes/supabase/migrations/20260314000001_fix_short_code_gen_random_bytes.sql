-- Fix gen_random_bytes resolution with empty search_path
-- The previous migration set search_path = '' on generate_production_short_code(),
-- but gen_random_bytes() lives in the extensions schema on Supabase.
-- Fully qualify the call so it resolves without needing search_path.

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
      bytes := extensions.gen_random_bytes(6);
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
