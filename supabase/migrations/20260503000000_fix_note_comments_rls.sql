-- Tighten note_comments RLS so every operation requires production membership.
-- Replaces the four USING (true) policies introduced in 20260402000000_add_note_comments.sql,
-- which let any authenticated user read/write/edit/delete every comment in the database.
--
-- note_comments has only note_id (no production_id), so we EXISTS-join through notes
-- and reuse the existing has_production_access(uuid, uuid) helper.
--
-- created_by is a free-text display name, not auth identity, so per-author UPDATE/DELETE
-- gating is not enforceable here. Tightening to "must have production access" closes the
-- cross-tenant breach without breaking working in-production flows. Per-author rules
-- can be added later once the column carries an auth-bound identifier.

DROP POLICY IF EXISTS "Users can view comments"   ON public.note_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.note_comments;
DROP POLICY IF EXISTS "Users can update comments" ON public.note_comments;
DROP POLICY IF EXISTS "Users can delete comments" ON public.note_comments;

CREATE POLICY "view comments on accessible notes" ON public.note_comments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.id = note_comments.note_id
      AND public.has_production_access(auth.uid(), n.production_id)
  ));

CREATE POLICY "insert comments on accessible notes" ON public.note_comments
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.id = note_comments.note_id
      AND public.has_production_access(auth.uid(), n.production_id)
  ));

CREATE POLICY "update comments on accessible notes" ON public.note_comments
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.id = note_comments.note_id
      AND public.has_production_access(auth.uid(), n.production_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.id = note_comments.note_id
      AND public.has_production_access(auth.uid(), n.production_id)
  ));

CREATE POLICY "delete comments on accessible notes" ON public.note_comments
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.id = note_comments.note_id
      AND public.has_production_access(auth.uid(), n.production_id)
  ));
