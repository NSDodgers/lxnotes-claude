import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { ActionCell } from '../cells/action-cell'
import { PriorityCell } from '../cells/priority-cell'
import { TypeCell } from '../cells/type-cell'
import { dateSortFn } from '../sorting/cue-sort-functions'
import { SortingFn } from '@tanstack/react-table'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'

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
export function createProductionColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
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
      cell: ({ row }) => <PriorityCell note={row.original} moduleType="production" />,
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
      cell: ({ row }) => <TypeCell note={row.original} moduleType="production" />,
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
      cell: ({ getValue }) => (
        <div className="font-medium max-w-md">{getValue() as string}</div>
      ),
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