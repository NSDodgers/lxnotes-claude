import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { ActionCell } from '../cells/action-cell'
import { PriorityCell } from '../cells/priority-cell'
import { TypeCell } from '../cells/type-cell'
import { EditableTextCell } from '../cells/editable-text-cell'
import { EditableTypeCell } from '../cells/editable-type-cell'
import { EditablePriorityCell } from '../cells/editable-priority-cell'
import { dateSortFn } from '../sorting/cue-sort-functions'
import { SortingFn } from '@tanstack/react-table'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { InlineEditingState, EditableColumn } from '@/hooks/use-inline-editing'

/**
 * Custom sort function for priority specific to production notes
 */
const prioritySortFn: SortingFn<Note> = (rowA, rowB) => {
  const { getPriorities } = useCustomPrioritiesStore.getState()
  const priorities = getPriorities('production')

  const priorityA = priorities.find(p => p.value === rowA.original.priority)
  const priorityB = priorities.find(p => p.value === rowB.original.priority)

  const sortOrderA = priorityA?.sortOrder ?? 999
  const sortOrderB = priorityB?.sortOrder ?? 999

  return sortOrderA - sortOrderB
}

interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  inlineEditing?: InlineEditingState & {
    onSave: (noteId: string, column: EditableColumn, value: string) => void
    onAdvance: (column: EditableColumn) => void
    onCancel: (noteId: string, isNewNote: boolean) => void
  }
}

/**
 * Formats a date to the format used in the original table
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(date))
}

/**
 * Creates column definitions for the production notes table
 */
export function createProductionColumns({ onStatusUpdate, inlineEditing }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <ActionCell note={row.original} onStatusUpdate={onStatusUpdate} />,
      enableSorting: false,
      enableResizing: true,
      size: 80,
      minSize: 80,
      maxSize: 120,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const note = row.original
        if (inlineEditing) {
          const isEditing = inlineEditing.editingNoteId === note.id && inlineEditing.editingColumn === 'priority'
          return (
            <EditablePriorityCell
              note={note}
              moduleType="production"
              isEditing={isEditing}
              onSave={inlineEditing.onSave}
              onAdvance={inlineEditing.onAdvance}
              onCancel={inlineEditing.onCancel}
              isNewNote={inlineEditing.isNewNote}
            />
          )
        }
        return <PriorityCell note={note} moduleType="production" />
      },
      sortingFn: prioritySortFn,
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const note = row.original
        if (inlineEditing) {
          const isEditing = inlineEditing.editingNoteId === note.id && inlineEditing.editingColumn === 'type'
          return (
            <EditableTypeCell
              note={note}
              moduleType="production"
              isEditing={isEditing}
              onSave={inlineEditing.onSave}
              onAdvance={inlineEditing.onAdvance}
              onCancel={inlineEditing.onCancel}
              isNewNote={inlineEditing.isNewNote}
            />
          )
        }
        return <TypeCell note={note} moduleType="production" />
      },
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: 'title',
      header: 'Note',
      cell: ({ row }) => {
        const note = row.original
        if (inlineEditing) {
          const isEditing = inlineEditing.editingNoteId === note.id && inlineEditing.editingColumn === 'title'
          return (
            <EditableTextCell
              note={note}
              column="title"
              value={note.title}
              isEditing={isEditing}
              onSave={inlineEditing.onSave}
              onAdvance={inlineEditing.onAdvance}
              onCancel={inlineEditing.onCancel}
              isNewNote={inlineEditing.isNewNote}
              placeholder="Type note..."
            />
          )
        }
        return <div className="font-medium max-w-md">{note.title}</div>
      },
      enableSorting: false,
      enableResizing: true,
      size: 400,
      minSize: 200,
    },
    {
      accessorKey: 'createdBy',
      header: 'Who Created',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm text-muted-foreground">{value || ''}</span>
      },
      enableSorting: false,
      enableResizing: true,
      size: 130,
      minSize: 100,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => {
        const value = getValue() as Date
        return <span className="text-sm text-muted-foreground">{formatDate(value)}</span>
      },
      sortingFn: dateSortFn,
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 180,
      minSize: 150,
    },
  ]
}
