import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { ActionCell } from '../cells/action-cell'
import { PriorityCell } from '../cells/priority-cell'
import { TypeCell } from '../cells/type-cell'
import { ScriptLookupCell } from '../cells/script-lookup-cell'
import { prioritySortFn, cueNumberSortFn, dateSortFn } from '../sorting/cue-sort-functions'

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
 * Creates column definitions for the cue notes table
 */
export function createCueColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
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
      cell: ({ row }) => <PriorityCell note={row.original} moduleType="cue" />,
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
      cell: ({ row }) => <TypeCell note={row.original} moduleType="cue" />,
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 120,
      minSize: 100,
    },
    {
      id: 'cueNumber',
      accessorFn: (row) => row.cueNumber,
      header: 'Cue #',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm">{value || '-'}</span>
      },
      sortingFn: cueNumberSortFn,
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 80,
      minSize: 60,
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
      id: 'scriptLookup',
      accessorFn: (row) => row.cueNumber,
      header: 'Script Page - Scene/Song',
      cell: ({ row }) => <ScriptLookupCell cueNumber={row.original.cueNumber} />,
      enableSorting: false,
      enableResizing: true,
      size: 200,
      minSize: 150,
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