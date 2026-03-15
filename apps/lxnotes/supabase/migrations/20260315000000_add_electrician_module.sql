-- Add electrician module type (replaces unused 'actor' module type)
-- Electrician Notes is a fixture-aware module for the electrician team

-- Update notes table CHECK constraint
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_module_type_check;
ALTER TABLE public.notes ADD CONSTRAINT notes_module_type_check
  CHECK (module_type IN ('cue', 'work', 'production', 'electrician'));

-- Update scenes_songs table CHECK constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'scenes_songs_module_type_check'
    AND table_name = 'scenes_songs'
  ) THEN
    ALTER TABLE public.scenes_songs DROP CONSTRAINT scenes_songs_module_type_check;
    ALTER TABLE public.scenes_songs ADD CONSTRAINT scenes_songs_module_type_check
      CHECK (module_type IN ('cue', 'work', 'production', 'electrician'));
  END IF;
END $$;

-- Update custom_types table CHECK constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'custom_types_module_type_check'
    AND table_name = 'custom_types'
  ) THEN
    ALTER TABLE public.custom_types DROP CONSTRAINT custom_types_module_type_check;
    ALTER TABLE public.custom_types ADD CONSTRAINT custom_types_module_type_check
      CHECK (module_type IN ('cue', 'work', 'production', 'electrician'));
  END IF;
END $$;

-- Update custom_priorities table CHECK constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'custom_priorities_module_type_check'
    AND table_name = 'custom_priorities'
  ) THEN
    ALTER TABLE public.custom_priorities DROP CONSTRAINT custom_priorities_module_type_check;
    ALTER TABLE public.custom_priorities ADD CONSTRAINT custom_priorities_module_type_check
      CHECK (module_type IN ('cue', 'work', 'production', 'electrician'));
  END IF;
END $$;

-- Migrate any existing 'actor' data to 'electrician' (in case any exists)
UPDATE public.notes SET module_type = 'electrician' WHERE module_type = 'actor';
