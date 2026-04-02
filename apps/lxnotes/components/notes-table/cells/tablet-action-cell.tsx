'use client'

import { Check, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleType, Note, NoteStatus } from '@/types'

interface TabletActionCellProps {
  note: Note
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  moduleType?: ModuleType
}

export function TabletActionCell({ note, onStatusUpdate, moduleType }: TabletActionCellProps) {
  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onStatusUpdate(note.id, note.status === 'complete' ? 'todo' : 'complete')
        }}
        title={note.status === 'complete' ? 'Mark as todo' : 'Mark as complete'}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
          note.status === 'complete'
            ? 'bg-status-complete text-white'
            : 'bg-status-complete/20 text-status-complete hover:bg-status-complete/30'
        )}
      >
        <Check className="h-6 w-6" strokeWidth={3} />
      </button>
      {moduleType === 'work' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStatusUpdate(note.id, note.status === 'review' ? 'todo' : 'review')
          }}
          title={note.status === 'review' ? 'Mark as todo' : 'Mark as in review'}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
            note.status === 'review'
              ? 'bg-status-review text-white'
              : 'bg-status-review/20 text-status-review hover:bg-status-review/30'
          )}
        >
          <Eye className="h-6 w-6" strokeWidth={3} />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onStatusUpdate(note.id, note.status === 'cancelled' ? 'todo' : 'cancelled')
        }}
        title={note.status === 'cancelled' ? 'Reopen' : 'Cancel'}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
          note.status === 'cancelled'
            ? 'bg-status-cancelled text-white'
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        )}
      >
        <X className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  )
}
