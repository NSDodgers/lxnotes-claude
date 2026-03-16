'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Note } from '@/types'
import type { EditableColumn } from '@/hooks/use-inline-editing'

interface EditableTextCellProps {
  note: Note
  column: EditableColumn
  value: string
  isEditing: boolean
  onSave: (noteId: string, column: EditableColumn, value: string) => void
  onAdvance: (column: EditableColumn) => void
  onCancel: (noteId: string, isNewNote: boolean) => void
  isNewNote: boolean
  placeholder?: string
}

export function EditableTextCell({
  note,
  column,
  value,
  isEditing,
  onSave,
  onAdvance,
  onCancel,
  isNewNote,
  placeholder,
}: EditableTextCellProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setLocalValue(value)
      // Small delay to ensure DOM is ready after row insertion
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing, value])

  const handleSaveAndAdvance = useCallback(() => {
    const trimmed = localValue.trim()
    if (trimmed !== value) {
      onSave(note.id, column, trimmed)
    }
    onAdvance(column)
  }, [localValue, value, onSave, note.id, column, onAdvance])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      handleSaveAndAdvance()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel(note.id, isNewNote)
    }
  }, [handleSaveAndAdvance, onCancel, note.id, isNewNote])

  if (!isEditing) {
    if (column === 'title') {
      return <div className="font-medium max-w-md">{value || '-'}</div>
    }
    return <span className="text-sm">{value || '-'}</span>
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSaveAndAdvance}
      placeholder={placeholder}
      className="w-full bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      onClick={(e) => e.stopPropagation()}
    />
  )
}
