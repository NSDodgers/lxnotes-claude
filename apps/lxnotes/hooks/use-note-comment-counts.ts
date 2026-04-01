'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any
import { useNoteCommentsStore } from '@/lib/stores/note-comments-store'

/**
 * Hook to fetch and subscribe to comment counts for all notes in a production.
 * Populates the note comments store so table cells can read counts via useNoteCommentsStore.
 * Call once at the page level for each module.
 * Pass productionId = undefined for demo mode (no-op).
 */
export function useNoteCommentCounts(productionId: string | undefined): void {
  const setCounts = useNoteCommentsStore(state => state.setCounts)

  useEffect(() => {
    if (!productionId) return

    let cancelled = false

    const fetchCounts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('note_comments' as SupabaseAny)
        .select('note_id, notes!inner(production_id)')
        .eq('notes.production_id', productionId)
        .is('deleted_at', null)

      if (cancelled || error) {
        if (error) console.error('[NoteCommentCounts] Fetch error:', error)
        return
      }

      const map: Record<string, number> = {}
      for (const row of (data as SupabaseAny) as Array<{ note_id: string }>) {
        map[row.note_id] = (map[row.note_id] || 0) + 1
      }
      setCounts(map)
    }

    fetchCounts()
    return () => { cancelled = true }
  }, [productionId, setCounts])

  useEffect(() => {
    if (!productionId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`note-comment-counts-${productionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_comments',
        },
        () => {
          const refetch = async () => {
            const { data, error } = await supabase
              .from('note_comments' as SupabaseAny)
              .select('note_id, notes!inner(production_id)')
              .eq('notes.production_id', productionId)
              .is('deleted_at', null)

            if (error) return

            const map: Record<string, number> = {}
            for (const row of (data as SupabaseAny) as Array<{ note_id: string }>) {
              map[row.note_id] = (map[row.note_id] || 0) + 1
            }
            setCounts(map)
          }
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productionId, setCounts])
}
