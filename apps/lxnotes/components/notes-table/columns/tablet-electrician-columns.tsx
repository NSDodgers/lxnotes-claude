import { ColumnDef } from '@tanstack/react-table'
import { ModuleType, Note, NoteStatus } from '@/types'
import { TabletPriorityDot } from '../cells/tablet-priority-dot'
import { TabletActionCell } from '../cells/tablet-action-cell'
import { FixtureAggregateCell } from '../cells/fixture-aggregate-cell'


interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onMoveModule?: (noteId: string, moduleType: ModuleType) => void
}

export function createTabletElectricianColumns({ onStatusUpdate, onMoveModule }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <TabletPriorityDot note={row.original} moduleType="electrician" />,
      enableSorting: false,
      enableResizing: false,
      size: 120,
    },
    {
      id: 'positions',
      header: 'Position',
      cell: ({ row }) => (
        <FixtureAggregateCell noteId={row.original.id} field="positions" />
      ),
      enableSorting: false,
      enableResizing: false,
      size: 100,
    },
    {
      id: 'channels',
      header: 'Ch',
      cell: ({ row }) => (
        <FixtureAggregateCell noteId={row.original.id} field="channels" fallbackChannels={row.original.channelNumbers} />
      ),
      enableSorting: false,
      enableResizing: false,
      size: 70,
    },
    {
      accessorKey: 'description',
      header: 'Note',
      cell: ({ row }) => (
        <div className="text-base font-medium break-words">{row.original.description}</div>
      ),
      enableSorting: false,
      enableResizing: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <TabletActionCell note={row.original} onStatusUpdate={onStatusUpdate} onMoveModule={onMoveModule} moduleType="electrician" />,
      enableSorting: false,
      enableResizing: false,
      size: 140,
    },
  ]
}
