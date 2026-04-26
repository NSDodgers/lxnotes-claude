# Pre-merge RLS verification (Light Mode PR)

The `user_preferences` JSONB column added in `20260425000000_add_user_preferences.sql` is user-scoped data. Before merging, verify that the existing `user_settings` table has Row-Level Security enabled with policies restricting access to `auth.uid() = user_id`. The base table definition lives outside the migration tree, so this check must be run against the live Supabase project.

## Verification SQL

Run against Supabase (SQL Editor or `supabase db diff` against an env that has the live state):

```sql
-- Confirm RLS is ENABLED on user_settings
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_settings';
-- Expect: rowsecurity = true
```

```sql
-- List existing policies on user_settings
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_settings';
-- Expect at minimum:
--   SELECT  policy where qual matches `(auth.uid() = user_id)`
--   INSERT  policy with with_check `(auth.uid() = user_id)`
--   UPDATE  policy with qual + with_check both `(auth.uid() = user_id)`
```

## Remediation if any policy is missing

```sql
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

If the base table or RLS policies are missing entirely, this is a blocker for ANY user-scoped column on this table — fix in a separate, prior migration before merging the light-mode PR.
