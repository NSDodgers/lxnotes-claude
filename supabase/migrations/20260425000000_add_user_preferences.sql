-- Add user_preferences JSONB column to user_settings for cross-device user prefs.
-- Theme lives at user_preferences.theme (one of 'light' | 'dark' | 'system').
-- Validation is enforced at the app layer (see ThemeSyncProvider) so this column
-- can grow with future preferences (font size, density, palette) without further migrations.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS user_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
