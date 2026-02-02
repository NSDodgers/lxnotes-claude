-- Allow Authenticated Users to Create Productions
-- Migration: 20260201000000_allow_authenticated_production_creation
-- Description: Enables any authenticated Gmail user to create productions (previously super admin only)
--              and automatically adds the creator as an admin member

-- ============================================
-- UPDATE PRODUCTION INSERT POLICY
-- ============================================

-- Drop the super-admin-only policy
DROP POLICY IF EXISTS "Super admin can create productions" ON productions;

-- Allow all authenticated users to create productions
CREATE POLICY "Authenticated users can create productions" ON productions
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- AUTO-ADD CREATOR AS ADMIN MEMBER
-- ============================================

-- Trigger function to automatically add the production creator as an admin member
-- Note: SET row_security = off is required to bypass RLS on production_members table
CREATE OR REPLACE FUNCTION public.handle_new_production()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Add the creator as an admin member of the new production
  INSERT INTO production_members (production_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');

  RETURN NEW;
END;
$$;

-- Create trigger to run after production creation
CREATE TRIGGER on_production_created
  AFTER INSERT ON productions
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_production();

COMMENT ON FUNCTION public.handle_new_production() IS 'Automatically adds the production creator as an admin member';
