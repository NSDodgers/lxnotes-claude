-- Secure Production Creation
-- Migration: 20260202000000_secure_production_creation
-- Description: Adds email verification requirement and rate limiting to production creation
--              Addresses security concerns with overly permissive WITH CHECK (true) policy

-- ============================================
-- DROP OVERLY PERMISSIVE POLICY
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create productions" ON productions;

-- ============================================
-- RATE LIMITING HELPER FUNCTION
-- ============================================

-- Count productions where user is admin (proxy for "created by")
-- Using production_members since productions table lacks created_by column
CREATE OR REPLACE FUNCTION get_user_production_count(check_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM production_members
  WHERE user_id = check_user_id
    AND role = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION get_user_production_count(UUID) IS
  'Returns count of productions where user is admin, used for rate limiting';

-- ============================================
-- SECURE PRODUCTION INSERT POLICY
-- ============================================

-- New policy with email verification and rate limiting
-- - Requires verified email (prevents spam accounts)
-- - Limits users to 20 productions as admin (prevents abuse)
-- - Super admin bypasses these restrictions
CREATE POLICY "Verified users can create productions with rate limit" ON productions
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Super admin bypasses all checks
    is_super_admin(auth.uid())
    OR (
      -- Require email verification
      -- Note: Supabase JWT includes email_verified claim from auth.users
      (auth.jwt() ->> 'email_verified')::boolean = true
      -- Rate limit: max 20 productions per user
      AND get_user_production_count(auth.uid()) < 20
    )
  );

COMMENT ON POLICY "Verified users can create productions with rate limit" ON productions IS
  'Requires email verification and limits non-admin users to 20 productions';
