'use client'

import { ArrowRightLeft, Check, Trash2, X, Eye, MessageSquare } from 'lucide-react'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useNoteCommentsStore } from '@/lib/stores/note-comments-store'
import type { Note, NoteStatus, ModuleType } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface MobileNoteCardProps {
  note: Note
  moduleType: ModuleType
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onEdit: (note: Note) => void
  onMoveModule?: (noteId: string, moduleType: ModuleType) => void
}

function MobileNoteCard({ note, moduleType, onStatusUpdate, onEdit, onMoveModule }: MobileNoteCardProps) {
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()
  const commentCount = useNoteCommentsStore(state => state.counts[note.id] || 0)
  const setOpenNoteId = useNoteCommentsStore(state => state.setOpenNoteId)
  const types = getTypes(moduleType)
  const priorities = getPriorities(moduleType)
  const noteType = types.find(t => t.value === note.type)
  const priority = priorities.find(p => p.value === note.priority)

  return (
    <div
      className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3 active:bg-bg-tertiary transition-colors"
      onClick={() => onEdit(note)}
      data-testid={`mobile-note-card-${note.id}`}
    >
      {/* Top row: priority dot + label, type badge, module-specific ID */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        {/* Priority */}
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: priority?.color || '#6B7280' }}
        />
        <span
          className="text-xs font-medium"
          style={{ color: priority?.color || '#6B7280' }}
        >
          {priority?.label || note.priority}
        </span>

        {/* Type badge */}
        {noteType && (
          <span
            className="text-[10px] font-medium px-1.5 py-0 rounded-full text-white leading-4"
            style={{ backgroundColor: noteType.color }}
          >
            {noteType.label}
          </span>
        )}

        {/* Comment count */}
        {commentCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setOpenNoteId(note.id) }}
            className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"
            data-testid={`mobile-comment-count-${note.id}`}
          >
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </button>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Module-specific field */}
        {note.cueNumber && (
          <span className="text-[11px] font-mono text-text-secondary shrink-0">Q{note.cueNumber}</span>
        )}
        {note.channelNumbers && (
          <span className="text-[11px] font-mono text-text-secondary shrink-0 truncate max-w-[80px]">Ch {note.channelNumbers}</span>
        )}
      </div>

      {/* Note title */}
      <p className="text-[13px] text-text-primary leading-snug mb-1">
        {note.description || <span className="text-text-muted italic">No title</span>}
      </p>

      {/* Script page / scene info */}
      {(note.scriptPageId || note.sceneSongId) && (
        <p className="text-[11px] text-text-muted mb-1">
          {[note.scriptPageId && `Pg. ${note.scriptPageId}`, note.sceneSongId].filter(Boolean).join(' - ')}
        </p>
      )}

      {/* Position info for work/electrician */}
      {note.positionUnit && (
        <p className="text-[11px] text-text-muted mb-1">{note.positionUnit}</p>
      )}

      {/* Scenery needs */}
      {note.sceneryNeeds && (
        <p className="text-[11px] text-text-muted mb-1">Scenery: {note.sceneryNeeds}</p>
      )}

      {/* Move button - shown for work/electrician modules regardless of status */}
      {(moduleType === 'work' || moduleType === 'electrician') && onMoveModule && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-bg-tertiary">
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-teal-500/20 text-teal-400"
            onClick={(e) => { e.stopPropagation(); onMoveModule(note.id, note.moduleType) }}
            aria-label={moduleType === 'work' ? 'Move to Electrician Notes' : 'Move to Work Notes'}
          >
            <ArrowRightLeft className="h-3 w-3" /> {moduleType === 'work' ? 'Move to Electrician' : 'Move to Work'}
          </button>
        </div>
      )}

      {/* Action buttons - icon + short label, compact */}
      {note.status === 'todo' && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-bg-tertiary">
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-complete/20 text-status-complete"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'complete') }}
          >
            <Check className="h-3 w-3" /> Done
          </button>
          {moduleType === 'work' && (
            <button
              className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-review/20 text-status-review"
              onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'review') }}
            >
              <Eye className="h-3 w-3" /> Review
            </button>
          )}
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-bg-tertiary text-text-secondary"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'cancelled') }}
          >
            <X className="h-3 w-3" /> Cancel
          </button>
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-deleted/20 text-status-deleted"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'deleted') }}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}

      {/* Review status actions */}
      {note.status === 'review' && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-bg-tertiary">
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-complete/20 text-status-complete"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'complete') }}
          >
            <Check className="h-3 w-3" /> Done
          </button>
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-todo/20 text-status-todo"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'todo') }}
          >
            To Do
          </button>
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-deleted/20 text-status-deleted"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'deleted') }}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}

      {/* Complete status actions */}
      {note.status === 'complete' && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-bg-tertiary">
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-deleted/20 text-status-deleted"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'deleted') }}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}

      {/* Cancelled status actions */}
      {note.status === 'cancelled' && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-bg-tertiary">
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-deleted/20 text-status-deleted"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'deleted') }}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}

      {/* Deleted status actions */}
      {note.status === 'deleted' && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-bg-tertiary">
          <button
            className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium bg-status-todo/20 text-status-todo"
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(note.id, 'todo') }}
          >
            Restore
          </button>
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
  onMoveModule?: (noteId: string, moduleType: ModuleType) => void
  emptyIcon?: LucideIcon
  emptyMessage?: string
}

export function MobileNoteList({
  notes,
  moduleType,
  onStatusUpdate,
  onEdit,
  onMoveModule,
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
    <div className="space-y-2 p-2 pb-20">
      {notes.map((note) => (
        <MobileNoteCard
          key={note.id}
          note={note}
          moduleType={moduleType}
          onStatusUpdate={onStatusUpdate}
          onEdit={onEdit}
          onMoveModule={onMoveModule}
        />
      ))}
    </div>
  )
}
