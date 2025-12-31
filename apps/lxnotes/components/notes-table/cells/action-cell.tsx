'use client'

import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus } from '@/types'

interface ActionCellProps {
  note: Note
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
}

export function ActionCell({ note, onStatusUpdate }: ActionCellProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="complete"
        onClick={(e) => {
          e.stopPropagation()
          onStatusUpdate(note.id, note.status === 'complete' ? 'todo' : 'complete')
        }}
        title={note.status === 'complete' ? 'Mark as todo' : 'Mark as complete'}
        className={cn(
          "h-7 w-7",
          note.status === 'complete'
            ? "bg-status-complete/20 border-status-complete text-status-complete shadow-sm"
            : "opacity-60 hover:opacity-100"
        )}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="cancelled"
        onClick={(e) => {
          e.stopPropagation()
          onStatusUpdate(note.id, note.status === 'cancelled' ? 'todo' : 'cancelled')
        }}
        title={note.status === 'cancelled' ? 'Reopen' : 'Cancel'}
        className={cn(
          "h-7 w-7",
          note.status === 'cancelled'
            ? "bg-status-cancelled/20 border-status-cancelled text-status-cancelled shadow-sm"
            : "opacity-60 hover:opacity-100"
        )}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}