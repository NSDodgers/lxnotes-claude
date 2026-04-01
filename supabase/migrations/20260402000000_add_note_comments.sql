-- Note comments: threaded updates on notes across all modules
CREATE TABLE IF NOT EXISTS public.note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 2000 AND content <> ''),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

CREATE INDEX idx_note_comments_note_id ON public.note_comments(note_id);
CREATE INDEX idx_note_comments_created_at ON public.note_comments(created_at DESC);

ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments" ON public.note_comments
  FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON public.note_comments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update comments" ON public.note_comments
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete comments" ON public.note_comments
  FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.note_comments;

CREATE OR REPLACE FUNCTION public.update_note_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_comments_updated_at
  BEFORE UPDATE ON public.note_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_note_comments_updated_at();
