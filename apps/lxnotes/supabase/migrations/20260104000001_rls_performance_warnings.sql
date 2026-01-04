-- RLS Performance Optimization - Additional Fixes
-- Migration: 20260104000001_rls_performance_warnings
-- Description: Resolves remaining Supabase Performance Advisor warnings
--
-- Fixes:
-- 1. production_links: Add (SELECT auth.uid()) wrapping
-- 2. production_members: Replace FOR ALL with separate INSERT/UPDATE/DELETE policies
-- 3. production_invitations: Replace FOR ALL with separate INSERT/UPDATE/DELETE policies
-- 4. department_members: Replace FOR ALL with separate INSERT/UPDATE/DELETE policies
--
-- Note: realtime.messages warnings are Supabase internal and cannot be fixed here

-- ============================================
-- SECTION 1: FIX production_links (auth.uid() wrapping)
-- ============================================
-- The original migration used auth.uid() directly without (SELECT ...) wrapping

DROP POLICY IF EXISTS "Users can view links for their productions" ON public.production_links;
DROP POLICY IF EXISTS "Admins can create links" ON public.production_links;
DROP POLICY IF EXISTS "Admins can delete links" ON public.production_links;

-- SELECT: Users can view links for productions they're members of
CREATE POLICY "Users can view links for their productions" ON public.production_links
  FOR SELECT TO authenticated USING (
    source_production_id IN (
      SELECT production_id FROM public.production_members WHERE user_id = (SELECT auth.uid())
    )
    OR target_production_id IN (
      SELECT production_id FROM public.production_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- INSERT: Only admins can create links
CREATE POLICY "Admins can create links" ON public.production_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.production_members
      WHERE production_id = target_production_id
        AND user_id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- DELETE: Only admins can delete links
CREATE POLICY "Admins can delete links" ON public.production_links
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.production_members
      WHERE production_id = target_production_id
        AND user_id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- ============================================
-- SECTION 2: FIX production_members (Multiple Permissive Policies)
-- ============================================
-- Problem: FOR ALL policy overlaps with FOR SELECT policy
-- Solution: Replace FOR ALL with explicit INSERT/UPDATE/DELETE, merge SELECT access

DROP POLICY IF EXISTS "Admins can manage members" ON public.production_members;
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.production_members;

-- SELECT: Combined policy for users reading their own + admins reading all
CREATE POLICY "Users can read members" ON public.production_members
  FOR SELECT TO authenticated USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- INSERT: Admins only
CREATE POLICY "Admins can insert members" ON public.production_members
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- UPDATE: Admins only
CREATE POLICY "Admins can update members" ON public.production_members
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  )
  WITH CHECK (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- DELETE: Admins only
CREATE POLICY "Admins can delete members" ON public.production_members
  FOR DELETE TO authenticated USING (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- ============================================
-- SECTION 3: FIX production_invitations (Multiple Permissive Policies)
-- ============================================
-- Problem: FOR ALL policy overlaps with FOR SELECT policy
-- Solution: Replace FOR ALL with explicit INSERT/UPDATE/DELETE, merge SELECT access

DROP POLICY IF EXISTS "Admins can manage invitations" ON public.production_invitations;
DROP POLICY IF EXISTS "Users can see their pending invitations" ON public.production_invitations;

-- SELECT: Combined policy for pending invitations + admin access
CREATE POLICY "Users can read invitations" ON public.production_invitations
  FOR SELECT TO authenticated USING (
    -- Users can see their own pending invitations
    (
      email = (SELECT email FROM public.users WHERE id = (SELECT auth.uid()))
      AND status = 'pending'
    )
    -- Admins can see all invitations for their productions
    OR (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- INSERT: Admins only
CREATE POLICY "Admins can insert invitations" ON public.production_invitations
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- UPDATE: Admins only
CREATE POLICY "Admins can update invitations" ON public.production_invitations
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  )
  WITH CHECK (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- DELETE: Admins only
CREATE POLICY "Admins can delete invitations" ON public.production_invitations
  FOR DELETE TO authenticated USING (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- ============================================
-- SECTION 4: FIX department_members (Multiple Permissive Policies)
-- ============================================
-- Problem: FOR ALL policy overlaps with FOR SELECT policy
-- Solution: Replace FOR ALL with explicit INSERT/UPDATE/DELETE, merge SELECT access

DROP POLICY IF EXISTS "Admins can manage department members" ON public.department_members;
DROP POLICY IF EXISTS "Users can read department members in accessible productions" ON public.department_members;

-- SELECT: Combined policy for production access + admin access
CREATE POLICY "Users can read department members" ON public.department_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (SELECT public.has_production_access((SELECT auth.uid()), d.production_id))
    )
  );

-- INSERT: Production admins or department heads
CREATE POLICY "Admins can insert department members" ON public.department_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (
        (SELECT public.is_production_admin((SELECT auth.uid()), d.production_id))
        OR (SELECT public.is_department_head((SELECT auth.uid()), d.id))
      )
    )
  );

-- UPDATE: Production admins or department heads
CREATE POLICY "Admins can update department members" ON public.department_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (
        (SELECT public.is_production_admin((SELECT auth.uid()), d.production_id))
        OR (SELECT public.is_department_head((SELECT auth.uid()), d.id))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (
        (SELECT public.is_production_admin((SELECT auth.uid()), d.production_id))
        OR (SELECT public.is_department_head((SELECT auth.uid()), d.id))
      )
    )
  );

-- DELETE: Production admins or department heads
CREATE POLICY "Admins can delete department members" ON public.department_members
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (
        (SELECT public.is_production_admin((SELECT auth.uid()), d.production_id))
        OR (SELECT public.is_department_head((SELECT auth.uid()), d.id))
      )
    )
  );
