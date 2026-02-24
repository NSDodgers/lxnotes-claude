import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { TabletPriorityDot } from '../cells/tablet-priority-dot'
import { TabletActionCell } from '../cells/tablet-action-cell'
import { TypeCell } from '../cells/type-cell'

interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
}

export function createTabletProductionColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      accessorKey: 'priority',
      header: '',
      cell: ({ row }) => <TabletPriorityDot note={row.original} moduleType="production" />,
      enableSorting: false,
      enableResizing: false,
      size: 50,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <TypeCell note={row.original} moduleType="production" />,
      enableSorting: false,
      enableResizing: false,
      size: 90,
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
