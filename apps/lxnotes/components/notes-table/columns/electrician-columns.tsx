import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { ActionCell } from '../cells/action-cell'
import { PriorityCell } from '../cells/priority-cell'
import { TypeCell } from '../cells/type-cell'
import { EditableTextCell } from '../cells/editable-text-cell'
import { EditableTypeCell } from '../cells/editable-type-cell'
import { EditablePriorityCell } from '../cells/editable-priority-cell'
import { FixtureAggregateCell } from '../cells/fixture-aggregate-cell'
import { TypeColoredText } from '../cells/type-colored-text'
import { prioritySortFn, positionSortFn, channelsSortFn, dateSortFn } from '../sorting/work-sort-functions'
import type { InlineEditingState, EditableColumn } from '@/hooks/use-inline-editing'

interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  inlineEditing?: InlineEditingState & {
    onSave: (noteId: string, column: EditableColumn, value: string) => void
    onAdvance: (column: EditableColumn) => void
    onCancel: (noteId: string, isNewNote: boolean) => void
  }
}

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

export function createElectricianColumns({ onStatusUpdate, inlineEditing }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <ActionCell note={row.original} onStatusUpdate={onStatusUpdate} moduleType="electrician" />,
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
              moduleType="electrician"
              isEditing={isEditing}
              onSave={inlineEditing.onSave}
              onAdvance={inlineEditing.onAdvance}
              onCancel={inlineEditing.onCancel}
              isNewNote={inlineEditing.isNewNote}
            />
          )
        }
        return <PriorityCell note={note} moduleType="electrician" />
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
              moduleType="electrician"
              isEditing={isEditing}
              onSave={inlineEditing.onSave}
              onAdvance={inlineEditing.onAdvance}
              onCancel={inlineEditing.onCancel}
              isNewNote={inlineEditing.isNewNote}
            />
          )
        }
        return <TypeCell note={note} moduleType="electrician" />
      },
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 120,
      minSize: 100,
    },
    {
      id: 'channels',
      header: 'Channels',
      cell: ({ row }) => (
        <FixtureAggregateCell
          noteId={row.original.id}
          field="channels"
          fallbackChannels={row.original.channelNumbers}
        />
      ),
      sortingFn: channelsSortFn,
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 100,
      minSize: 80,
    },
    {
      id: 'fixtureTypes',
      header: 'Type',
      cell: ({ row }) => (
        <FixtureAggregateCell
          noteId={row.original.id}
          field="fixtureTypes"
        />
      ),
      enableSorting: false,
      enableResizing: true,
      size: 120,
      minSize: 100,
    },
    {
      id: 'purposes',
      header: 'Purpose',
      cell: ({ row }) => (
        <FixtureAggregateCell
          noteId={row.original.id}
          field="purposes"
        />
      ),
      enableSorting: false,
      enableResizing: true,
      size: 120,
      minSize: 100,
    },
    {
      id: 'positions',
      header: 'Position',
      cell: ({ row }) => (
        <FixtureAggregateCell
          noteId={row.original.id}
          field="positions"
        />
      ),
      sortingFn: positionSortFn,
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 150,
      minSize: 120,
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
              moduleType="electrician"
            />
          )
        }
        return <TypeColoredText note={note} moduleType="electrician" className="font-medium max-w-md">{note.title}</TypeColoredText>
      },
      enableSorting: false,
      enableResizing: true,
      size: 300,
      minSize: 150,
    },
    {
      accessorKey: 'sceneryNeeds',
      header: 'Scenery Needs',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm text-muted-foreground">{value || '-'}</span>
      },
      enableSorting: false,
      enableResizing: true,
      size: 150,
      minSize: 120,
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
