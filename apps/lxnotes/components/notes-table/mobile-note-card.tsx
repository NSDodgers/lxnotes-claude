'use client'

import { Check, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TabletPriorityDot } from './cells/tablet-priority-dot'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import type { Note, NoteStatus, ModuleType } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface MobileNoteCardProps {
  note: Note
  moduleType: ModuleType
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onEdit: (note: Note) => void
}

function MobileNoteCard({ note, moduleType, onStatusUpdate, onEdit }: MobileNoteCardProps) {
  const { getTypes } = useCustomTypesStore()
  const types = getTypes(moduleType)
  const noteType = types.find(t => t.value === note.type)

  return (
    <div
      className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3 active:bg-bg-tertiary transition-colors"
      onClick={() => onEdit(note)}
      data-testid={`mobile-note-card-${note.id}`}
    >
      {/* Top row: priority + module-specific field */}
      <div className="flex items-center justify-between mb-1.5">
        <TabletPriorityDot note={note} moduleType={moduleType} />
        {note.cueNumber && (
          <span className="text-xs font-mono text-text-secondary">Cue #{note.cueNumber}</span>
        )}
        {note.channelNumbers && (
          <span className="text-xs font-mono text-text-secondary">Ch {note.channelNumbers}</span>
        )}
      </div>

      {/* Type badge */}
      {noteType && (
        <span
          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 text-white"
          style={{ backgroundColor: noteType.color }}
        >
          {noteType.label}
        </span>
      )}

      {/* Note title */}
      <p className="text-sm text-text-primary leading-snug mb-1.5">
        {note.title || <span className="text-text-muted italic">No title</span>}
      </p>

      {/* Script page info */}
      {(note.scriptPageId || note.sceneSongId) && (
        <p className="text-xs text-text-muted mb-2">
          {[note.scriptPageId && `Pg. ${note.scriptPageId}`, note.sceneSongId].filter(Boolean).join(' - ')}
        </p>
      )}

      {/* Position info for work/electrician */}
      {note.positionUnit && (
        <p className="text-xs text-text-muted mb-2">{note.positionUnit}</p>
      )}

      {/* Action buttons */}
      {note.status === 'todo' && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-bg-tertiary">
          <Button
            size="sm"
            variant="complete"
            className="h-8 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onStatusUpdate(note.id, 'complete')
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Complete
          </Button>
          {moduleType === 'work' && (
            <Button
              size="sm"
              variant="review"
              className="h-8 text-xs flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate(note.id, 'review')
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Review
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onStatusUpdate(note.id, 'cancelled')
            }}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}

      {/* Review status actions */}
      {note.status === 'review' && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-bg-tertiary">
          <Button
            size="sm"
            variant="complete"
            className="h-8 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onStatusUpdate(note.id, 'complete')
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Complete
          </Button>
          <Button
            size="sm"
            variant="todo"
            className="h-8 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onStatusUpdate(note.id, 'todo')
            }}
          >
            Back to To Do
          </Button>
        </div>
      )}
    </div>
  )
}

// --- MobileNoteList ---

interface MobileNoteListProps {
  notes: Note[]
  moduleType: ModuleType
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onEdit: (note: Note) => void
  emptyIcon?: LucideIcon
  emptyMessage?: string
}

export function MobileNoteList({
  notes,
  moduleType,
  onStatusUpdate,
  onEdit,
  emptyIcon: EmptyIcon,
  emptyMessage = 'No notes found',
}: MobileNoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {EmptyIcon && <EmptyIcon className="h-10 w-10 text-text-muted mb-3" />}
        <p className="text-text-secondary text-sm">{emptyMessage}</p>
        <p className="text-text-muted text-xs mt-1">Try adjusting your filters or add a new note</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3 pb-24">
      {notes.map((note) => (
        <MobileNoteCard
          key={note.id}
          note={note}
          moduleType={moduleType}
          onStatusUpdate={onStatusUpdate}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
