'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import type { Note, ModuleType } from '@/types'
import type { EditableColumn } from '@/hooks/use-inline-editing'

interface EditableTypeCellProps {
  note: Note
  moduleType: ModuleType
  isEditing: boolean
  onSave: (noteId: string, column: EditableColumn, value: string) => void
  onAdvance: (column: EditableColumn) => void
  onCancel: (noteId: string, isNewNote: boolean) => void
  isNewNote: boolean
}

export function EditableTypeCell({
  note,
  moduleType,
  isEditing,
  onSave,
  onAdvance,
  onCancel,
  isNewNote,
}: EditableTypeCellProps) {
  const { getTypes } = useCustomTypesStore()
  const types = getTypes(moduleType)
  const currentType = types.find(t => t.value === (note.type || ''))
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        selectRef.current?.focus()
      })
    }
  }, [isEditing])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    const newValue = e.target.value
    onSave(note.id, 'type', newValue)
    onAdvance('type')
  }, [onSave, note.id, onAdvance])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      onAdvance('type')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel(note.id, isNewNote)
    }
  }, [onAdvance, onCancel, note.id, isNewNote])

  if (!isEditing) {
    return (
      <Badge
        style={{ backgroundColor: currentType?.color || '#6B7280' }}
        className="text-white"
      >
        {currentType?.label || note.type || moduleType}
      </Badge>
    )
  }

  return (
    <select
      ref={selectRef}
      value={note.type || ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => onAdvance('type')}
      className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      onClick={(e) => e.stopPropagation()}
    >
      {types.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  )
}
