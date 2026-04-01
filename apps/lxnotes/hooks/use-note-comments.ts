'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNoteCommentsStore } from '@/lib/stores/note-comments-store'
import type { NoteComment } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

interface DbNoteComment {
  id: string
  note_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}

function dbToNoteComment(row: DbNoteComment): NoteComment {
  return {
    id: row.id,
    noteId: row.note_id,
    content: row.content,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    deletedBy: row.deleted_by || undefined,
  }
}

interface UseNoteCommentsReturn {
  comments: NoteComment[]
  isLoading: boolean
  error: string | null
  addComment: (content: string, createdBy: string) => Promise<void>
  editComment: (commentId: string, newContent: string) => Promise<void>
  deleteComment: (commentId: string, deletedBy: string) => Promise<void>
  retry: () => void
}

export function useNoteComments(noteId: string | null): UseNoteCommentsReturn {
  const [comments, setComments] = useState<NoteComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const incrementCount = useNoteCommentsStore(state => state.incrementCount)
  const decrementCount = useNoteCommentsStore(state => state.decrementCount)

  const fetchComments = useCallback(async () => {
    if (!noteId) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('note_comments' as SupabaseAny)
      .select('*')
      .eq('note_id', noteId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[NoteComments] Fetch error:', fetchError)
      setError('Could not load comments.')
      setIsLoading(false)
      return
    }

    setComments(((data as SupabaseAny) as DbNoteComment[]).map(dbToNoteComment))
    setIsLoading(false)
  }, [noteId])

  useEffect(() => {
    if (noteId) {
      fetchComments()
    } else {
      setComments([])
      setError(null)
    }
  }, [noteId, fetchComments])

  const addComment = useCallback(async (content: string, createdBy: string) => {
    if (!noteId) return

    const optimisticId = crypto.randomUUID()
    const optimisticComment: NoteComment = {
      id: optimisticId,
      noteId,
      content,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setComments(prev => [optimisticComment, ...prev])
    incrementCount(noteId)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('note_comments' as SupabaseAny)
      .insert({ note_id: noteId, content, created_by: createdBy })
      .select()
      .single()

    if (insertError) {
      console.error('[NoteComments] Insert error:', insertError)
      setComments(prev => prev.filter(c => c.id !== optimisticId))
      decrementCount(noteId)
      throw new Error('Failed to add comment')
    }

    setComments(prev =>
      prev.map(c => c.id === optimisticId ? dbToNoteComment(data as SupabaseAny as DbNoteComment) : c)
    )
  }, [noteId, incrementCount, decrementCount])

  const editComment = useCallback(async (commentId: string, newContent: string) => {
    const original = comments.find(c => c.id === commentId)
    if (!original) return

    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, content: newContent, updatedAt: new Date() } : c)
    )

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('note_comments' as SupabaseAny)
      .update({ content: newContent })
      .eq('id', commentId)

    if (updateError) {
      console.error('[NoteComments] Update error:', updateError)
      setComments(prev =>
        prev.map(c => c.id === commentId ? original : c)
      )
      throw new Error('Failed to edit comment')
    }
  }, [comments])

  const deleteComment = useCallback(async (commentId: string, deletedBy: string) => {
    const original = comments.find(c => c.id === commentId)
    if (!original) return

    setComments(prev => prev.filter(c => c.id !== commentId))
    if (noteId) decrementCount(noteId)

    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('note_comments' as SupabaseAny)
      .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
      .eq('id', commentId)

    if (deleteError) {
      console.error('[NoteComments] Delete error:', deleteError)
      setComments(prev => [...prev, original].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ))
      if (noteId) incrementCount(noteId)
      throw new Error('Failed to delete comment')
    }
  }, [comments, noteId, incrementCount, decrementCount])

  return {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    retry: fetchComments,
  }
}
