'use client'

import { useEffect } from 'react'

/**
 * Shared hook to handle ?editNote={noteId} query param.
 * When present, calls onEditNote with the noteId and cleans the URL.
 * If the noteId is not found by the caller, they silently ignore it.
 * Uses window.location directly to avoid useSearchParams Suspense requirement.
 */
export function useEditNoteQueryParam(onEditNote: (noteId: string) => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const editNoteId = url.searchParams.get('editNote')
    if (!editNoteId) return

    onEditNote(editNoteId)

    // Clean the URL by removing the query param
    url.searchParams.delete('editNote')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [onEditNote])
}
