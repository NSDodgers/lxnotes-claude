'use client'

import { Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotes } from '@/lib/contexts/notes-context'

/**
 * Undo/Redo buttons for note operations.
 * Shows disabled state when no actions are available to undo/redo.
 */
export function UndoRedoButtons() {
  const { undoLastAction, redoLastAction, canUndo, canRedo } = useNotes()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={undoLastAction}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (⌘Z)"
        data-testid="undo-button"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={redoLastAction}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
        data-testid="redo-button"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
