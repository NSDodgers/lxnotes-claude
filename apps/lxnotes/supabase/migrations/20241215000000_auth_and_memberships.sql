-- Auth and Memberships Migration
-- Migration: 20241215_auth_and_memberships
-- Description: Adds user management, production memberships, invitations, and tenant-specific RLS policies

-- ============================================
-- USERS TABLE (synced from auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles synced from auth.users';

-- Trigger to sync users from auth.users on sign-up
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update users when auth metadata changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- PRODUCTION MEMBERS TABLE
-- ============================================
CREATE TABLE production_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(production_id, user_id)
);

CREATE INDEX idx_production_members_user ON production_members(user_id);
CREATE INDEX idx_production_members_production ON production_members(production_id);

COMMENT ON TABLE production_members IS 'Links users to productions with role-based access';

-- ============================================
-- PRODUCTION INVITATIONS TABLE
-- ============================================
CREATE TABLE production_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX idx_production_invitations_email ON production_invitations(email);
CREATE INDEX idx_production_invitations_token ON production_invitations(token);
CREATE INDEX idx_production_invitations_status ON production_invitations(status);

COMMENT ON TABLE production_invitations IS 'Pending invitations to join productions';

-- ============================================
-- APP SETTINGS TABLE (for super admin config)
-- ============================================
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE app_settings IS 'Application-wide settings accessible only to super admin';

-- Insert default MailerSend settings
INSERT INTO app_settings (key, value) VALUES
  ('mailersend', '{"api_key": null, "template_id": null, "from_email": "noreply@lxnotes.app", "from_name": "LX Notes"}');

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR ACCESS CONTROL
-- ============================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id AND email = 'nick@solyomdesign.com'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has access to production (member or super admin)
CREATE OR REPLACE FUNCTION has_production_access(check_user_id UUID, check_production_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM production_members
    WHERE user_id = check_user_id AND production_id = check_production_id
  ) OR is_super_admin(check_user_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is production admin (admin role or super admin)
CREATE OR REPLACE FUNCTION is_production_admin(check_user_id UUID, check_production_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM production_members
    WHERE user_id = check_user_id
    AND production_id = check_production_id
    AND role = 'admin'
  ) OR is_super_admin(check_user_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- RLS POLICIES FOR USERS TABLE
-- ============================================
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Super admin can read all users" ON public.users
  FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Production admins can read members" ON public.users
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM production_members pm
      WHERE pm.user_id = public.users.id
      AND is_production_admin(auth.uid(), pm.production_id)
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- ============================================
-- RLS POLICIES FOR PRODUCTION_MEMBERS
-- ============================================
CREATE POLICY "Users can read their own memberships" ON production_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admin can manage all memberships" ON production_members
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Production admins can read their production members" ON production_members
  FOR SELECT TO authenticated USING (is_production_admin(auth.uid(), production_id));

CREATE POLICY "Production admins can add members" ON production_members
  FOR INSERT TO authenticated WITH CHECK (is_production_admin(auth.uid(), production_id));

CREATE POLICY "Production admins can update members" ON production_members
  FOR UPDATE TO authenticated USING (is_production_admin(auth.uid(), production_id));

CREATE POLICY "Production admins can remove members" ON production_members
  FOR DELETE TO authenticated USING (is_production_admin(auth.uid(), production_id));

-- ============================================
-- RLS POLICIES FOR PRODUCTION_INVITATIONS
-- ============================================
CREATE POLICY "Super admin can manage all invitations" ON production_invitations
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Production admins can manage their invitations" ON production_invitations
  FOR ALL TO authenticated USING (is_production_admin(auth.uid(), production_id));

CREATE POLICY "Users can see their pending invitations" ON production_invitations
  FOR SELECT TO authenticated USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- ============================================
-- RLS POLICIES FOR APP_SETTINGS
-- ============================================
CREATE POLICY "Only super admin can access app settings" ON app_settings
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- ============================================
-- DROP AND REPLACE EXISTING PRODUCTION POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read productions" ON productions;
DROP POLICY IF EXISTS "Authenticated users can create productions" ON productions;
DROP POLICY IF EXISTS "Authenticated users can update productions" ON productions;
DROP POLICY IF EXISTS "Authenticated users can delete productions" ON productions;

-- Productions: Users can only see productions they have access to (or demo)
CREATE POLICY "Users can read accessible productions" ON productions
  FOR SELECT TO authenticated USING (
    has_production_access(auth.uid(), id) OR is_demo = true
  );

CREATE POLICY "Super admin can create productions" ON productions
  FOR INSERT TO authenticated WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Production admins can update productions" ON productions
  FOR UPDATE TO authenticated USING (is_production_admin(auth.uid(), id));

CREATE POLICY "Super admin can delete productions" ON productions
  FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

-- ============================================
-- DROP AND REPLACE EXISTING NOTES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read notes" ON notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON notes;
DROP POLICY IF EXISTS "Authenticated users can update notes" ON notes;
DROP POLICY IF EXISTS "Authenticated users can delete notes" ON notes;

CREATE POLICY "Users can read notes in accessible productions" ON notes
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create notes in accessible productions" ON notes
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update notes in accessible productions" ON notes
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete notes in accessible productions" ON notes
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- DROP AND REPLACE EXISTING FIXTURES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read fixtures" ON fixtures;
DROP POLICY IF EXISTS "Authenticated users can create fixtures" ON fixtures;
DROP POLICY IF EXISTS "Authenticated users can update fixtures" ON fixtures;
DROP POLICY IF EXISTS "Authenticated users can delete fixtures" ON fixtures;

CREATE POLICY "Users can read fixtures in accessible productions" ON fixtures
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create fixtures in accessible productions" ON fixtures
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update fixtures in accessible productions" ON fixtures
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete fixtures in accessible productions" ON fixtures
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- DROP AND REPLACE EXISTING SCRIPT_PAGES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read script_pages" ON script_pages;
DROP POLICY IF EXISTS "Authenticated users can create script_pages" ON script_pages;
DROP POLICY IF EXISTS "Authenticated users can update script_pages" ON script_pages;
DROP POLICY IF EXISTS "Authenticated users can delete script_pages" ON script_pages;

CREATE POLICY "Users can read script_pages in accessible productions" ON script_pages
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create script_pages in accessible productions" ON script_pages
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update script_pages in accessible productions" ON script_pages
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete script_pages in accessible productions" ON script_pages
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- DROP AND REPLACE EXISTING SCENES_SONGS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read scenes_songs" ON scenes_songs;
DROP POLICY IF EXISTS "Authenticated users can create scenes_songs" ON scenes_songs;
DROP POLICY IF EXISTS "Authenticated users can update scenes_songs" ON scenes_songs;
DROP POLICY IF EXISTS "Authenticated users can delete scenes_songs" ON scenes_songs;

CREATE POLICY "Users can read scenes_songs in accessible productions" ON scenes_songs
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create scenes_songs in accessible productions" ON scenes_songs
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update scenes_songs in accessible productions" ON scenes_songs
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete scenes_songs in accessible productions" ON scenes_songs
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- DROP AND REPLACE EXISTING WORK_NOTE_FIXTURE_LINKS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read work_note_fixture_links" ON work_note_fixture_links;
DROP POLICY IF EXISTS "Authenticated users can create work_note_fixture_links" ON work_note_fixture_links;
DROP POLICY IF EXISTS "Authenticated users can update work_note_fixture_links" ON work_note_fixture_links;
DROP POLICY IF EXISTS "Authenticated users can delete work_note_fixture_links" ON work_note_fixture_links;

-- For junction table, check via notes table
CREATE POLICY "Users can read work_note_fixture_links via notes" ON work_note_fixture_links
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND has_production_access(auth.uid(), notes.production_id)
    )
  );

CREATE POLICY "Users can create work_note_fixture_links via notes" ON work_note_fixture_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND has_production_access(auth.uid(), notes.production_id)
    )
  );

CREATE POLICY "Users can update work_note_fixture_links via notes" ON work_note_fixture_links
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND has_production_access(auth.uid(), notes.production_id)
    )
  );

CREATE POLICY "Users can delete work_note_fixture_links via notes" ON work_note_fixture_links
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = work_note_fixture_links.work_note_id
      AND has_production_access(auth.uid(), notes.production_id)
    )
  );

-- ============================================
-- DROP AND REPLACE EXISTING CUSTOM_TYPES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read custom_types" ON custom_types;
DROP POLICY IF EXISTS "Authenticated users can create custom_types" ON custom_types;
DROP POLICY IF EXISTS "Authenticated users can update custom_types" ON custom_types;
DROP POLICY IF EXISTS "Authenticated users can delete custom_types" ON custom_types;

CREATE POLICY "Users can read custom_types in accessible productions" ON custom_types
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create custom_types in accessible productions" ON custom_types
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update custom_types in accessible productions" ON custom_types
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete custom_types in accessible productions" ON custom_types
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- DROP AND REPLACE EXISTING CUSTOM_PRIORITIES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read custom_priorities" ON custom_priorities;
DROP POLICY IF EXISTS "Authenticated users can create custom_priorities" ON custom_priorities;
DROP POLICY IF EXISTS "Authenticated users can update custom_priorities" ON custom_priorities;
DROP POLICY IF EXISTS "Authenticated users can delete custom_priorities" ON custom_priorities;

CREATE POLICY "Users can read custom_priorities in accessible productions" ON custom_priorities
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create custom_priorities in accessible productions" ON custom_priorities
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update custom_priorities in accessible productions" ON custom_priorities
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete custom_priorities in accessible productions" ON custom_priorities
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- DROP AND REPLACE EXISTING POSITION_ORDERS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read position_orders" ON position_orders;
DROP POLICY IF EXISTS "Authenticated users can create position_orders" ON position_orders;
DROP POLICY IF EXISTS "Authenticated users can update position_orders" ON position_orders;
DROP POLICY IF EXISTS "Authenticated users can delete position_orders" ON position_orders;

CREATE POLICY "Users can read position_orders in accessible productions" ON position_orders
  FOR SELECT TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can create position_orders in accessible productions" ON position_orders
  FOR INSERT TO authenticated WITH CHECK (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can update position_orders in accessible productions" ON position_orders
  FOR UPDATE TO authenticated USING (has_production_access(auth.uid(), production_id));

CREATE POLICY "Users can delete position_orders in accessible productions" ON position_orders
  FOR DELETE TO authenticated USING (has_production_access(auth.uid(), production_id));

-- ============================================
-- ADD REALTIME FOR NEW TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE production_members;
ALTER PUBLICATION supabase_realtime ADD TABLE production_invitations;

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_members_updated_at
  BEFORE UPDATE ON production_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
