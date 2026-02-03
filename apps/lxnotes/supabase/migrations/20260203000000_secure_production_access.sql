-- Migration: Secure Production Access
-- Description: Updates RLS policies for productions table to restrict access to members only.

-- DROP EXISTING PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Authenticated users can read productions" ON productions;
DROP POLICY IF EXISTS "Authenticated users can update productions" ON productions;
DROP POLICY IF EXISTS "Authenticated users can delete productions" ON productions;
-- Note: "Authenticated users can create productions" is likely handled by 20260202000001_fix_production_creation_policy.sql or similar and should remain for creation.

-- CREATE SECURE POLICIES

-- READ: Users can only see productions they are members of
CREATE POLICY "Users can read productions they are members of" ON productions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM production_members
      WHERE production_id = productions.id
      AND user_id = auth.uid()
    )
  );

-- UPDATE: Only admins or members (depending on role logic) can update
-- Generally members might need to update for soft deletes or settings, but strict control is better.
-- For now, consistent with "read" but typically might want to restrict to admins for certain fields.
-- Assuming members can update (e.g. settings stored in production) or at least admins.
-- Let's stick to MEMBERS for now to be safe with the "preset" updates which are JSONB columns on production.
CREATE POLICY "Members can update productions" ON productions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM production_members
      WHERE production_id = productions.id
      AND user_id = auth.uid()
    )
  );

-- DELETE: Only admins can delete (soft or hard)
CREATE POLICY "Admins can delete productions" ON productions
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM production_members
      WHERE production_id = productions.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
