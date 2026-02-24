import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { TabletPriorityDot } from '../cells/tablet-priority-dot'
import { TabletActionCell } from '../cells/tablet-action-cell'
import { FixtureAggregateCell } from '../cells/fixture-aggregate-cell'

interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
}

export function createTabletWorkColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      accessorKey: 'priority',
      header: '',
      cell: ({ row }) => <TabletPriorityDot note={row.original} moduleType="work" />,
      enableSorting: false,
      enableResizing: false,
      size: 50,
    },
    {
      id: 'positions',
      header: 'Position',
      cell: ({ row }) => (
        <FixtureAggregateCell noteId={row.original.id} field="positions" maxItems={1} />
      ),
      enableSorting: false,
      enableResizing: false,
      size: 100,
    },
    {
      id: 'channels',
      header: 'Ch',
      cell: ({ row }) => (
        <FixtureAggregateCell noteId={row.original.id} field="channels" />
      ),
      enableSorting: false,
      enableResizing: false,
      size: 70,
    },
    {
      accessorKey: 'title',
      header: 'Note',
      cell: ({ getValue }) => (
        <div className="text-base font-medium truncate">{getValue() as string}</div>
      ),
      enableSorting: false,
      enableResizing: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <TabletActionCell note={row.original} onStatusUpdate={onStatusUpdate} />,
      enableSorting: false,
      enableResizing: false,
      size: 140,
    },
  ]
}
