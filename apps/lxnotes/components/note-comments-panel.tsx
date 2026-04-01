'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNoteCommentsStore } from '@/lib/stores/note-comments-store'
import { useNoteComments } from '@/hooks/use-note-comments'
import { useNotes } from '@/lib/contexts/notes-context'
import { useAuthContext } from '@/components/auth/auth-provider'
import { isDemoMode } from '@/lib/demo-data'
import type { NoteComment } from '@/types'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getDisplayName(user: { user_metadata?: Record<string, string>; email?: string } | null): string {
  if (!user) return 'Unknown'
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown'
}

interface CommentItemProps {
  comment: NoteComment
  currentUser: string
  onEdit: (commentId: string, newContent: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

function CommentItem({ comment, currentUser, onEdit, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isOwn = comment.createdBy === currentUser
  const isEdited = comment.updatedAt.getTime() - comment.createdAt.getTime() > 1000

  const handleSave = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      setEditContent(comment.content)
      return
    }
    setIsSaving(true)
    try {
      await onEdit(comment.id, editContent.trim())
      setIsEditing(false)
    } catch {
      toast.error('Failed to edit comment')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(comment.id)
    } catch {
      toast.error('Failed to delete comment')
    }
    setIsDeleting(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditContent(comment.content)
    }
  }

  return (
    <div className="group" data-testid={`comment-${comment.id}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-sm truncate">{comment.createdBy}</span>
          {isEdited && (
            <span className="text-xs text-muted-foreground italic">(edited)</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatRelativeTime(comment.createdAt)}
        </span>
      </div>

      {isEditing ? (
        <div className="mt-1.5">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="min-h-[60px] text-sm resize-none"
            maxLength={2000}
            autoFocus
          />
          <div className="flex items-center gap-1 mt-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleSave}
              disabled={isSaving || !editContent.trim()}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => { setIsEditing(false); setEditContent(comment.content) }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">Cmd+Enter to save</span>
          </div>
        </div>
      ) : isDeleting ? (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Delete this comment?</span>
          <Button
            size="sm"
            variant="destructive"
            className="h-6 px-2 text-xs"
            onClick={handleDelete}
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setIsDeleting(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
          {isOwn && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => { setIsEditing(true); setEditContent(comment.content) }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setIsDeleting(true)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface NoteCommentsPanelProps {
  productionId: string | undefined
}

export function NoteCommentsPanel({ productionId }: NoteCommentsPanelProps) {
  const openNoteId = useNoteCommentsStore(state => state.openNoteId)
  const setOpenNoteId = useNoteCommentsStore(state => state.setOpenNoteId)
  const isDemo = isDemoMode()
  const { comments, isLoading, error, addComment, editComment, deleteComment, retry } = useNoteComments(isDemo ? null : openNoteId)
  const { user } = useAuthContext()
  const displayName = getDisplayName(user)

  const { getNotes } = useNotes()
  const allNotes = [
    ...getNotes('cue'),
    ...getNotes('work'),
    ...getNotes('production'),
    ...getNotes('electrician'),
  ]
  const note = openNoteId ? allNotes.find(n => n.id === openNoteId) : null

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleClose = useCallback(() => {
    setOpenNoteId(null)
    setNewComment('')
  }, [setOpenNoteId])

  useEffect(() => {
    if (!openNoteId) {
      setNewComment('')
    }
  }, [openNoteId])

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting || isDemo) return
    setIsSubmitting(true)
    try {
      await addComment(newComment.trim(), displayName)
      setNewComment('')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleEdit = async (commentId: string, newContent: string) => {
    await editComment(commentId, newContent)
  }

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId, displayName)
  }

  const noteDescription = note?.description || 'Untitled note'
  const truncatedDescription = noteDescription.length > 80
    ? noteDescription.slice(0, 80) + '...'
    : noteDescription

  return (
    <Sheet open={!!openNoteId} onOpenChange={(open) => { if (!open) handleClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <SheetTitle className="text-base">
            Comments{comments.length > 0 ? ` (${comments.length})` : ''}
          </SheetTitle>
          <SheetDescription className="text-xs truncate">
            {truncatedDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isDemo ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Comments are available in live productions
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={retry} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No comments yet. Add the first update.
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={displayName}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {!isDemo && (
          <div className="shrink-0 border-t px-6 py-3">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="min-h-[60px] max-h-[150px] text-sm resize-none"
                maxLength={2000}
                rows={2}
              />
              <Button
                size="icon"
                className="shrink-0 self-end"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {newComment.length > 1800 && (
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {newComment.length}/2000
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Cmd+Enter to send</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
