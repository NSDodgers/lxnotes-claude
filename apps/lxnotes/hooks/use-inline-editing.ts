'use client'

import { useState, useCallback } from 'react'
import type { ModuleType } from '@/types'

export type EditableColumn = 'title' | 'type' | 'priority' | 'cueNumber'

const EDITABLE_COLUMN_ORDER: Record<ModuleType, EditableColumn[]> = {
  cue: ['title', 'type', 'priority', 'cueNumber'],
  work: ['title', 'type', 'priority'],
  production: ['title', 'type', 'priority'],
  actor: ['title', 'type', 'priority'],
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
}

export type InlineEditing = InlineEditingState & InlineEditingActions

export function useInlineEditing(moduleType: ModuleType): InlineEditing {
  const [state, setState] = useState<InlineEditingState>({
    editingNoteId: null,
    editingColumn: null,
    isNewNote: false,
  })

  const startEditing = useCallback((noteId: string, column: EditableColumn, isNew = false) => {
    setState({ editingNoteId: noteId, editingColumn: column, isNewNote: isNew })
  }, [])

  const stopEditing = useCallback(() => {
    setState({ editingNoteId: null, editingColumn: null, isNewNote: false })
  }, [])

  const moveToNextCell = useCallback((currentColumn: EditableColumn) => {
    const order = EDITABLE_COLUMN_ORDER[moduleType]
    const currentIndex = order.indexOf(currentColumn)
    if (currentIndex < order.length - 1) {
      setState(prev => ({ ...prev, editingColumn: order[currentIndex + 1] }))
    } else {
      // Last column — done editing
      setState({ editingNoteId: null, editingColumn: null, isNewNote: false })
    }
  }, [moduleType])

  return {
    ...state,
    startEditing,
    stopEditing,
    moveToNextCell,
  }
}
