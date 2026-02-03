-- Fix Production Creation Policy
-- Migration: 20260202000001_fix_production_creation_policy
-- Description: Replaces unreliable JWT email_verified check with direct database check
--              to resolve RLS errors during production creation.

-- ============================================
-- HELPER FUNCTION
-- ============================================

-- Check if user's email is verified (direct DB check)
CREATE OR REPLACE FUNCTION is_email_verified(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id
    AND email_confirmed_at IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION is_email_verified(UUID) IS 'Checks if the user has a confirmed email address';

-- ============================================
-- UPDATE PRODUCTION INSERT POLICY
-- ============================================

-- Drop the previous policy
DROP POLICY IF EXISTS "Verified users can create productions with rate limit" ON productions;

-- Recreate with reliable check
CREATE POLICY "Verified users can create productions with rate limit" ON productions
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Super admin bypasses all checks
    is_super_admin(auth.uid())
    OR (
      -- Require email verification (direct DB check)
      is_email_verified(auth.uid())
      -- Rate limit: max 20 productions per user
      AND get_user_production_count(auth.uid()) < 20
    )
  );

COMMENT ON POLICY "Verified users can create productions with rate limit" ON productions IS
  'Requires verified email and limits non-admin users to 20 productions';
