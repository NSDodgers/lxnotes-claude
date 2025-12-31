-- RLS Performance Optimization
-- Migration: 20241226000000_rls_performance_optimization
-- Description: Consolidates search path fixes, JWT optimization, initPlan wrapping, and policy consolidation
-- Resolves: 59 "Auth RLS Initialization Plan" warnings + 9 "Multiple Permissive Policies" warnings
--
-- Changes:
-- 1. All SECURITY DEFINER functions get SET search_path = ''
-- 2. is_super_admin() uses JWT claims for current user (avoids circular RLS)
-- 3. All RLS policies wrap auth.uid() and helper functions in (SELECT ...) for initPlan optimization
-- 4. Consolidated multiple permissive policies using OR logic:
--    - users: 4 policies → 2 (combined 3 SELECT policies into 1)
--    - production_members: 6 policies → 2 (combined 5 admin policies into 1)
--    - production_invitations: 3 policies → 2 (combined 2 admin policies into 1)

-- ============================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================

-- 1. update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 2. handle_new_user (sync from auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 3. handle_user_update (sync updates from auth.users)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 4. is_super_admin (with JWT optimization for current user)
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- If checking the currently authenticated user, use JWT claims (avoids circular RLS on users table)
  IF check_user_id = auth.uid() THEN
    RETURN COALESCE((auth.jwt() ->> 'email') = 'nick@solyomdesign.com', FALSE);
  END IF;
  -- Fallback: Check database for other users
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id AND email = 'nick@solyomdesign.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- 5. has_production_access (check super admin first - now cheap with JWT)
CREATE OR REPLACE FUNCTION public.has_production_access(check_user_id UUID, check_production_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_super_admin(check_user_id) OR EXISTS (
    SELECT 1 FROM public.production_members
    WHERE user_id = check_user_id AND production_id = check_production_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- 6. is_production_admin (check super admin first)
CREATE OR REPLACE FUNCTION public.is_production_admin(check_user_id UUID, check_production_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_super_admin(check_user_id) OR EXISTS (
    SELECT 1 FROM public.production_members
    WHERE user_id = check_user_id
    AND production_id = check_production_id
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- ============================================
-- SECTION 2: RLS POLICIES - USERS TABLE
-- ============================================
-- Consolidated: Combines 3 SELECT policies into single policy with OR logic
-- Resolves "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Super admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Production admins can read members" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read profiles" ON public.users;

CREATE POLICY "Users can read profiles" ON public.users
  FOR SELECT TO authenticated USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_super_admin((SELECT auth.uid())))
    OR EXISTS (
      SELECT 1 FROM public.production_members pm
      WHERE pm.user_id = public.users.id
      AND (SELECT public.is_production_admin((SELECT auth.uid()), pm.production_id))
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()));

-- ============================================
-- SECTION 3: RLS POLICIES - PRODUCTION_MEMBERS TABLE
-- ============================================
-- Consolidated: Combines 5 admin policies into single FOR ALL policy
-- Resolves "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.production_members;
DROP POLICY IF EXISTS "Super admin can manage all memberships" ON public.production_members;
DROP POLICY IF EXISTS "Production admins can read their production members" ON public.production_members;
DROP POLICY IF EXISTS "Production admins can add members" ON public.production_members;
DROP POLICY IF EXISTS "Production admins can update members" ON public.production_members;
DROP POLICY IF EXISTS "Production admins can remove members" ON public.production_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.production_members;

CREATE POLICY "Admins can manage members" ON public.production_members
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  )
  WITH CHECK (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

CREATE POLICY "Users can read their own memberships" ON public.production_members
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SECTION 4: RLS POLICIES - PRODUCTION_INVITATIONS TABLE
-- ============================================
-- Consolidated: Combines super admin + production admin into single policy
-- Resolves "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "Super admin can manage all invitations" ON public.production_invitations;
DROP POLICY IF EXISTS "Production admins can manage their invitations" ON public.production_invitations;
DROP POLICY IF EXISTS "Users can see their pending invitations" ON public.production_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.production_invitations;

CREATE POLICY "Admins can manage invitations" ON public.production_invitations
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  )
  WITH CHECK (
    (SELECT public.is_super_admin((SELECT auth.uid())))
    OR (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

CREATE POLICY "Users can see their pending invitations" ON public.production_invitations
  FOR SELECT TO authenticated USING (
    email = (SELECT email FROM public.users WHERE id = (SELECT auth.uid()))
    AND status = 'pending'
  );

-- ============================================
-- SECTION 5: RLS POLICIES - APP_SETTINGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Only super admin can access app settings" ON public.app_settings;

CREATE POLICY "Only super admin can access app settings" ON public.app_settings
  FOR ALL TO authenticated USING ((SELECT public.is_super_admin((SELECT auth.uid()))));

-- ============================================
-- SECTION 6: RLS POLICIES - PRODUCTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read accessible productions" ON public.productions;
DROP POLICY IF EXISTS "Super admin can create productions" ON public.productions;
DROP POLICY IF EXISTS "Production admins can update productions" ON public.productions;
DROP POLICY IF EXISTS "Super admin can delete productions" ON public.productions;

CREATE POLICY "Users can read accessible productions" ON public.productions
  FOR SELECT TO authenticated USING (
    (SELECT public.has_production_access((SELECT auth.uid()), id)) OR is_demo = true
  );

CREATE POLICY "Super admin can create productions" ON public.productions
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_super_admin((SELECT auth.uid()))));

CREATE POLICY "Production admins can update productions" ON public.productions
  FOR UPDATE TO authenticated USING ((SELECT public.is_production_admin((SELECT auth.uid()), id)));

CREATE POLICY "Super admin can delete productions" ON public.productions
  FOR DELETE TO authenticated USING ((SELECT public.is_super_admin((SELECT auth.uid()))));

-- ============================================
-- SECTION 7: RLS POLICIES - NOTES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read notes in accessible productions" ON public.notes;
DROP POLICY IF EXISTS "Users can create notes in accessible productions" ON public.notes;
DROP POLICY IF EXISTS "Users can update notes in accessible productions" ON public.notes;
DROP POLICY IF EXISTS "Users can delete notes in accessible productions" ON public.notes;

CREATE POLICY "Users can read notes in accessible productions" ON public.notes
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create notes in accessible productions" ON public.notes
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update notes in accessible productions" ON public.notes
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete notes in accessible productions" ON public.notes
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

-- ============================================
-- SECTION 8: RLS POLICIES - FIXTURES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read fixtures in accessible productions" ON public.fixtures;
DROP POLICY IF EXISTS "Users can create fixtures in accessible productions" ON public.fixtures;
DROP POLICY IF EXISTS "Users can update fixtures in accessible productions" ON public.fixtures;
DROP POLICY IF EXISTS "Users can delete fixtures in accessible productions" ON public.fixtures;

CREATE POLICY "Users can read fixtures in accessible productions" ON public.fixtures
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create fixtures in accessible productions" ON public.fixtures
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update fixtures in accessible productions" ON public.fixtures
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete fixtures in accessible productions" ON public.fixtures
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

-- ============================================
-- SECTION 9: RLS POLICIES - SCRIPT_PAGES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read script_pages in accessible productions" ON public.script_pages;
DROP POLICY IF EXISTS "Users can create script_pages in accessible productions" ON public.script_pages;
DROP POLICY IF EXISTS "Users can update script_pages in accessible productions" ON public.script_pages;
DROP POLICY IF EXISTS "Users can delete script_pages in accessible productions" ON public.script_pages;

CREATE POLICY "Users can read script_pages in accessible productions" ON public.script_pages
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create script_pages in accessible productions" ON public.script_pages
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update script_pages in accessible productions" ON public.script_pages
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete script_pages in accessible productions" ON public.script_pages
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

-- ============================================
-- SECTION 10: RLS POLICIES - SCENES_SONGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read scenes_songs in accessible productions" ON public.scenes_songs;
DROP POLICY IF EXISTS "Users can create scenes_songs in accessible productions" ON public.scenes_songs;
DROP POLICY IF EXISTS "Users can update scenes_songs in accessible productions" ON public.scenes_songs;
DROP POLICY IF EXISTS "Users can delete scenes_songs in accessible productions" ON public.scenes_songs;

CREATE POLICY "Users can read scenes_songs in accessible productions" ON public.scenes_songs
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create scenes_songs in accessible productions" ON public.scenes_songs
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update scenes_songs in accessible productions" ON public.scenes_songs
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete scenes_songs in accessible productions" ON public.scenes_songs
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

-- ============================================
-- SECTION 11: RLS POLICIES - WORK_NOTE_FIXTURE_LINKS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read work_note_fixture_links via notes" ON public.work_note_fixture_links;
DROP POLICY IF EXISTS "Users can create work_note_fixture_links via notes" ON public.work_note_fixture_links;
DROP POLICY IF EXISTS "Users can update work_note_fixture_links via notes" ON public.work_note_fixture_links;
DROP POLICY IF EXISTS "Users can delete work_note_fixture_links via notes" ON public.work_note_fixture_links;

CREATE POLICY "Users can read work_note_fixture_links via notes" ON public.work_note_fixture_links
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND (SELECT public.has_production_access((SELECT auth.uid()), notes.production_id))
    )
  );

CREATE POLICY "Users can create work_note_fixture_links via notes" ON public.work_note_fixture_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND (SELECT public.has_production_access((SELECT auth.uid()), notes.production_id))
    )
  );

CREATE POLICY "Users can update work_note_fixture_links via notes" ON public.work_note_fixture_links
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND (SELECT public.has_production_access((SELECT auth.uid()), notes.production_id))
    )
  );

CREATE POLICY "Users can delete work_note_fixture_links via notes" ON public.work_note_fixture_links
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND (SELECT public.has_production_access((SELECT auth.uid()), notes.production_id))
    )
  );

-- ============================================
-- SECTION 12: RLS POLICIES - CUSTOM_TYPES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read custom_types in accessible productions" ON public.custom_types;
DROP POLICY IF EXISTS "Users can create custom_types in accessible productions" ON public.custom_types;
DROP POLICY IF EXISTS "Users can update custom_types in accessible productions" ON public.custom_types;
DROP POLICY IF EXISTS "Users can delete custom_types in accessible productions" ON public.custom_types;

CREATE POLICY "Users can read custom_types in accessible productions" ON public.custom_types
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create custom_types in accessible productions" ON public.custom_types
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update custom_types in accessible productions" ON public.custom_types
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete custom_types in accessible productions" ON public.custom_types
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

-- ============================================
-- SECTION 13: RLS POLICIES - CUSTOM_PRIORITIES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read custom_priorities in accessible productions" ON public.custom_priorities;
DROP POLICY IF EXISTS "Users can create custom_priorities in accessible productions" ON public.custom_priorities;
DROP POLICY IF EXISTS "Users can update custom_priorities in accessible productions" ON public.custom_priorities;
DROP POLICY IF EXISTS "Users can delete custom_priorities in accessible productions" ON public.custom_priorities;

CREATE POLICY "Users can read custom_priorities in accessible productions" ON public.custom_priorities
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create custom_priorities in accessible productions" ON public.custom_priorities
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update custom_priorities in accessible productions" ON public.custom_priorities
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete custom_priorities in accessible productions" ON public.custom_priorities
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

-- ============================================
-- SECTION 14: RLS POLICIES - POSITION_ORDERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can read position_orders in accessible productions" ON public.position_orders;
DROP POLICY IF EXISTS "Users can create position_orders in accessible productions" ON public.position_orders;
DROP POLICY IF EXISTS "Users can update position_orders in accessible productions" ON public.position_orders;
DROP POLICY IF EXISTS "Users can delete position_orders in accessible productions" ON public.position_orders;

CREATE POLICY "Users can read position_orders in accessible productions" ON public.position_orders
  FOR SELECT TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can create position_orders in accessible productions" ON public.position_orders
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can update position_orders in accessible productions" ON public.position_orders
  FOR UPDATE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));

CREATE POLICY "Users can delete position_orders in accessible productions" ON public.position_orders
  FOR DELETE TO authenticated USING ((SELECT public.has_production_access((SELECT auth.uid()), production_id)));
