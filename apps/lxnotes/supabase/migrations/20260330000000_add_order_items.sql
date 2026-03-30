-- Order Items table
-- Stores supply/order items attached to individual work and electrician notes.
-- Each item has a name and an "ordered" checkbox.

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ordered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Items display in insertion order (created_at). No drag-reorder in v1.
CREATE INDEX idx_order_items_note_id ON order_items(note_id);

-- Auto-update updated_at on row changes
CREATE TRIGGER set_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN production_members pm ON pm.production_id = n.production_id
      WHERE n.id = order_items.note_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN production_members pm ON pm.production_id = n.production_id
      WHERE n.id = order_items.note_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update order items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN production_members pm ON pm.production_id = n.production_id
      WHERE n.id = order_items.note_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete order items"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN production_members pm ON pm.production_id = n.production_id
      WHERE n.id = order_items.note_id AND pm.user_id = auth.uid()
    )
  );

-- Enable realtime for order_items
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
