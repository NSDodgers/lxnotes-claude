'use client'

import { MessageSquare } from 'lucide-react'
import { useNoteCommentsStore } from '@/lib/stores/note-comments-store'

interface CommentCountCellProps {
  noteId: string
}

export function CommentCountCell({ noteId }: CommentCountCellProps) {
  const count = useNoteCommentsStore(state => state.counts[noteId] || 0)
  const setOpenNoteId = useNoteCommentsStore(state => state.setOpenNoteId)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setOpenNoteId(noteId)
      }}
      className="inline-flex items-center gap-1 text-sm transition-colors hover:text-foreground"
      data-testid={`comment-count-${noteId}`}
    >
      <MessageSquare className={`h-3.5 w-3.5 ${count > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      {count > 0 && <span className="text-foreground">{count}</span>}
    </button>
  )
}
