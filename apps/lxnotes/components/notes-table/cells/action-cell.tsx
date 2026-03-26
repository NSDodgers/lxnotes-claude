'use client'

import { Check, Eye, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ModuleType, Note, NoteStatus } from '@/types'

interface ActionCellProps {
  note: Note
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  moduleType?: ModuleType
}

export function ActionCell({ note, onStatusUpdate, moduleType }: ActionCellProps) {
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
            ? "bg-status-complete/20 border-status-complete text-status-complete shadow-xs"
            : "opacity-60 hover:opacity-100"
        )}
      >
        <Check className="h-3 w-3" />
      </Button>
      {moduleType === 'work' && (
        <Button
          size="icon"
          variant="review"
          onClick={(e) => {
            e.stopPropagation()
            onStatusUpdate(note.id, note.status === 'review' ? 'todo' : 'review')
          }}
          title={note.status === 'review' ? 'Mark as todo' : 'Mark as in review'}
          className={cn(
            "h-7 w-7",
            note.status === 'review'
              ? "bg-status-review/20 border-status-review text-status-review shadow-xs"
              : "opacity-60 hover:opacity-100"
          )}
        >
          <Eye className="h-3 w-3" />
        </Button>
      )}
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
            ? "bg-status-cancelled/20 border-status-cancelled text-status-cancelled shadow-xs"
            : "opacity-60 hover:opacity-100"
        )}
      >
        <X className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="deleted"
        onClick={(e) => {
          e.stopPropagation()
          onStatusUpdate(note.id, note.status === 'deleted' ? 'todo' : 'deleted')
        }}
        title={note.status === 'deleted' ? 'Restore' : 'Delete'}
        className={cn(
          "h-7 w-7",
          note.status === 'deleted'
            ? "bg-status-deleted/20 border-status-deleted text-status-deleted shadow-xs"
            : "opacity-60 hover:opacity-100"
        )}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}