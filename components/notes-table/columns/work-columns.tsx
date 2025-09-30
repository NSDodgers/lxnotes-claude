import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { ActionCell } from '../cells/action-cell'
import { PriorityCell } from '../cells/priority-cell'
import { TypeCell } from '../cells/type-cell'
import { FixtureAggregateCell } from '../cells/fixture-aggregate-cell'
import { prioritySortFn, positionSortFn, channelsSortFn, dateSortFn } from '../sorting/work-sort-functions'

interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
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
 * Creates column definitions for the work notes table
 */
export function createWorkColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
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
      cell: ({ row }) => <PriorityCell note={row.original} moduleType="work" />,
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
      cell: ({ row }) => <TypeCell note={row.original} moduleType="work" />,
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
          maxItems={2}
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
          maxItems={2}
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
          maxItems={2}
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
      cell: ({ getValue }) => (
        <div className="font-medium max-w-md">{getValue() as string}</div>
      ),
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
        return <span className="text-sm text-muted-foreground">{value || 'Nick Solyom'}</span>
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