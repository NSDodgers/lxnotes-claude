-- Cross-App Departments Migration
-- Migration: 20251231000000_cross_app_departments
-- Description: Adds departments, department members, and note transfers for cross-app note sharing
--              Prepares database for future Director Notes app interconnection
--
-- New Tables:
-- - departments: Defines departments per production (Lighting, Direction, Sound, etc.)
-- - department_members: Links users to departments with roles
-- - note_transfers: Audit trail for notes sent between apps
--
-- Modified Tables:
-- - notes: Add app_id, source_department_id, is_transferred, transferred_at
-- - production_members: Add primary_department_id
-- - notes.module_type: Extended to include 'actor' for Director Notes

-- ============================================
-- SECTION 1: NEW TABLES
-- ============================================

-- 1.1 DEPARTMENTS TABLE
-- Defines departments per production that can send/receive notes
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- 'Lighting', 'Direction', 'Sound', etc.
  slug TEXT NOT NULL,           -- 'lighting', 'direction' (URL-safe)
  app_id TEXT NOT NULL,         -- 'lxnotes', 'director_notes'
  color TEXT,                   -- Optional department color (hex)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(production_id, slug)
);

COMMENT ON TABLE public.departments IS 'Departments per production for cross-app note routing';
COMMENT ON COLUMN public.departments.app_id IS 'Which app owns this department (lxnotes, director_notes)';
COMMENT ON COLUMN public.departments.slug IS 'URL-safe identifier for the department';

CREATE INDEX idx_departments_production ON public.departments(production_id);
CREATE INDEX idx_departments_app ON public.departments(production_id, app_id);

-- 1.2 DEPARTMENT_MEMBERS TABLE
-- Links users to departments within a production
CREATE TABLE public.department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('head', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, user_id)
);

COMMENT ON TABLE public.department_members IS 'Links users to departments with role-based access';
COMMENT ON COLUMN public.department_members.role IS 'head = department head (receives notifications), member = regular member';

CREATE INDEX idx_department_members_user ON public.department_members(user_id);
CREATE INDEX idx_department_members_department ON public.department_members(department_id);

-- 1.3 NOTE_TRANSFERS TABLE
-- Tracks lineage of notes transferred between apps (audit trail only, no sync)
CREATE TABLE public.note_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (the original note)
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE SET NULL,
  source_app_id TEXT NOT NULL,
  source_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,

  -- Target (the copied note)
  target_note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  target_app_id TEXT NOT NULL,
  target_department_id UUID NOT NULL REFERENCES public.departments(id),

  -- Metadata
  sent_by UUID NOT NULL REFERENCES public.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  in_reply_to_id UUID REFERENCES public.note_transfers(id),  -- For reply chains

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.note_transfers IS 'Audit trail for notes transferred between apps';
COMMENT ON COLUMN public.note_transfers.in_reply_to_id IS 'Reference to original transfer when this is a reply';

CREATE INDEX idx_note_transfers_source ON public.note_transfers(source_note_id);
CREATE INDEX idx_note_transfers_target ON public.note_transfers(target_note_id);
CREATE INDEX idx_note_transfers_departments ON public.note_transfers(source_department_id, target_department_id);
CREATE INDEX idx_note_transfers_sent_by ON public.note_transfers(sent_by);

-- ============================================
-- SECTION 2: MODIFY EXISTING TABLES
-- ============================================

-- 2.1 Add cross-app columns to notes table
ALTER TABLE public.notes ADD COLUMN app_id TEXT DEFAULT 'lxnotes';
ALTER TABLE public.notes ADD COLUMN source_department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.notes ADD COLUMN is_transferred BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notes ADD COLUMN transferred_at TIMESTAMPTZ;

COMMENT ON COLUMN public.notes.app_id IS 'Which app owns this note (lxnotes, director_notes)';
COMMENT ON COLUMN public.notes.source_department_id IS 'Department that created this note';
COMMENT ON COLUMN public.notes.is_transferred IS 'Whether this note has been sent to another app';
COMMENT ON COLUMN public.notes.transferred_at IS 'When note was sent (NULL = not sent)';

CREATE INDEX idx_notes_app ON public.notes(production_id, app_id);
CREATE INDEX idx_notes_transferred ON public.notes(production_id, is_transferred) WHERE is_transferred = TRUE;

-- 2.2 Extend module_type to include 'actor' for Director Notes
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_module_type_check;
ALTER TABLE public.notes ADD CONSTRAINT notes_module_type_check
  CHECK (module_type IN ('cue', 'work', 'production', 'actor'));

-- 2.3 Add primary_department_id to production_members
ALTER TABLE public.production_members ADD COLUMN primary_department_id UUID REFERENCES public.departments(id);

COMMENT ON COLUMN public.production_members.primary_department_id IS 'User''s primary department for note routing';

-- ============================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================

-- Check if user is a member of a specific department
CREATE OR REPLACE FUNCTION public.is_department_member(check_user_id UUID, check_department_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_members
    WHERE user_id = check_user_id AND department_id = check_department_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- Check if user is a department head
CREATE OR REPLACE FUNCTION public.is_department_head(check_user_id UUID, check_department_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_members
    WHERE user_id = check_user_id
    AND department_id = check_department_id
    AND role = 'head'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- Get production_id from department_id
CREATE OR REPLACE FUNCTION public.get_department_production_id(check_department_id UUID)
RETURNS UUID AS $$
  SELECT production_id FROM public.departments WHERE id = check_department_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- ============================================
-- SECTION 4: ENABLE RLS
-- ============================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 5: RLS POLICIES FOR DEPARTMENTS
-- ============================================

-- Users can read departments in productions they have access to
CREATE POLICY "Users can read departments in accessible productions" ON public.departments
  FOR SELECT TO authenticated USING (
    (SELECT public.has_production_access((SELECT auth.uid()), production_id))
  );

-- Production admins can create departments
CREATE POLICY "Production admins can create departments" ON public.departments
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- Production admins can update departments
CREATE POLICY "Production admins can update departments" ON public.departments
  FOR UPDATE TO authenticated USING (
    (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- Production admins can delete departments
CREATE POLICY "Production admins can delete departments" ON public.departments
  FOR DELETE TO authenticated USING (
    (SELECT public.is_production_admin((SELECT auth.uid()), production_id))
  );

-- ============================================
-- SECTION 6: RLS POLICIES FOR DEPARTMENT_MEMBERS
-- ============================================

-- Users can read department members in productions they have access to
CREATE POLICY "Users can read department members in accessible productions" ON public.department_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (SELECT public.has_production_access((SELECT auth.uid()), d.production_id))
    )
  );

-- Production admins or department heads can manage members
CREATE POLICY "Admins can manage department members" ON public.department_members
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
      AND (
        (SELECT public.is_production_admin((SELECT auth.uid()), d.production_id))
        OR (SELECT public.is_department_head((SELECT auth.uid()), d.id))
      )
    )
  );

-- ============================================
-- SECTION 7: RLS POLICIES FOR NOTE_TRANSFERS
-- ============================================

-- Users can read transfers involving their departments
CREATE POLICY "Users can read relevant transfers" ON public.note_transfers
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.user_id = (SELECT auth.uid())
      AND (
        dm.department_id = note_transfers.source_department_id
        OR dm.department_id = note_transfers.target_department_id
      )
    )
    OR (SELECT public.is_super_admin((SELECT auth.uid())))
  );

-- Users can create transfers from their departments
CREATE POLICY "Users can create transfers from their department" ON public.note_transfers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.user_id = (SELECT auth.uid())
      AND dm.department_id = note_transfers.source_department_id
    )
  );

-- ============================================
-- SECTION 8: ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_transfers;

-- ============================================
-- SECTION 9: TRIGGERS
-- ============================================

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
