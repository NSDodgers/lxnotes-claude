'use client'

import { useState, useCallback, useRef } from 'react'
import type { ModuleType } from '@/types'

export type EditableColumn = 'title' | 'type' | 'priority' | 'cueNumber'

const EDITABLE_COLUMN_ORDER: Record<ModuleType, EditableColumn[]> = {
  cue: ['cueNumber', 'title', 'priority', 'type'],
  work: ['title', 'priority', 'type'],
  production: ['title', 'priority', 'type'],
  electrician: ['title', 'priority', 'type'],
}

export interface InlineEditingState {
  editingNoteId: string | null
  editingColumn: EditableColumn | null
  isNewNote: boolean
}

export interface InlineEditingActions {
  startEditing: (noteId: string, column: EditableColumn, isNew?: boolean) => void
  stopEditing: () => void
  moveToNextCell: (currentColumn: EditableColumn) => void
  setLastType: (type: string) => void
}

export type InlineEditing = InlineEditingState & InlineEditingActions & { lastType: string | null }

export function useInlineEditing(moduleType: ModuleType): InlineEditing {
  const [state, setState] = useState<InlineEditingState>({
    editingNoteId: null,
    editingColumn: null,
    isNewNote: false,
  })
  const lastTypeRef = useRef<string | null>(null)

  const startEditing = useCallback((noteId: string, column: EditableColumn, isNew = false) => {
    setState(prev => {
      if (prev.editingNoteId === noteId && prev.editingColumn === column) {
        return prev
      }
      return { editingNoteId: noteId, editingColumn: column, isNewNote: isNew }
    })
  }, [])

  const stopEditing = useCallback(() => {
    setState({ editingNoteId: null, editingColumn: null, isNewNote: false })
  }, [])

  const moveToNextCell = useCallback((currentColumn: EditableColumn) => {
    const order = EDITABLE_COLUMN_ORDER[moduleType]
    const currentIndex = order.indexOf(currentColumn)
    if (currentIndex < order.length - 1) {
      setState(prev => {
        // Only advance if we're still editing this column — prevents
        // cascade when blur fires on unmounted cells during re-render
        if (prev.editingColumn !== currentColumn) return prev
        return { ...prev, editingColumn: order[currentIndex + 1] }
      })
    } else {
      setState(prev => {
        if (prev.editingColumn !== currentColumn) return prev
        return { editingNoteId: null, editingColumn: null, isNewNote: false }
      })
    }
  }, [moduleType])

  const setLastType = useCallback((type: string) => {
    lastTypeRef.current = type
  }, [])

  return {
    ...state,
    lastType: lastTypeRef.current,
    startEditing,
    stopEditing,
    moveToNextCell,
    setLastType,
  }
}
