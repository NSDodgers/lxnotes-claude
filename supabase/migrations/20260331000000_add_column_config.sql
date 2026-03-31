-- Add column_config JSONB column to user_settings for per-user column visibility and ordering
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS column_config JSONB NOT NULL DEFAULT '{}';
