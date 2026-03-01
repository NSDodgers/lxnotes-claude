'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { Note, ModuleType } from '@/types'
import type { EditableColumn } from '@/hooks/use-inline-editing'

interface EditablePriorityCellProps {
  note: Note
  moduleType: ModuleType
  isEditing: boolean
  onSave: (noteId: string, column: EditableColumn, value: string) => void
  onAdvance: (column: EditableColumn) => void
  onCancel: (noteId: string, isNewNote: boolean) => void
  isNewNote: boolean
}

export function EditablePriorityCell({
  note,
  moduleType,
  isEditing,
  onSave,
  onAdvance,
  onCancel,
  isNewNote,
}: EditablePriorityCellProps) {
  const { getPriorities } = useCustomPrioritiesStore()
  const priorities = getPriorities(moduleType)
  const currentPriority = priorities.find(p => p.value === note.priority)
  const selectRef = useRef<HTMLSelectElement>(null)
  const advancedRef = useRef(false)

  useEffect(() => {
    if (isEditing) {
      advancedRef.current = false
      requestAnimationFrame(() => {
        selectRef.current?.focus()
      })
    }
  }, [isEditing])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    const newValue = e.target.value
    onSave(note.id, 'priority', newValue)
    advancedRef.current = true
    onAdvance('priority')
  }, [onSave, note.id, onAdvance])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      advancedRef.current = true
      onAdvance('priority')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      advancedRef.current = true
      onCancel(note.id, isNewNote)
    }
  }, [onAdvance, onCancel, note.id, isNewNote])

  if (!isEditing) {
    return (
      <span
        className="text-sm font-medium"
        style={{ color: currentPriority?.color || '#6B7280' }}
      >
        {currentPriority?.label || note.priority}
      </span>
    )
  }

  return (
    <select
      ref={selectRef}
      value={note.priority}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (advancedRef.current) {
          advancedRef.current = false
          return
        }
        onAdvance('priority')
      }}
      className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      onClick={(e) => e.stopPropagation()}
    >
      {priorities.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  )
}
