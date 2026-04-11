import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { TabletPriorityDot } from '../cells/tablet-priority-dot'
import { TabletActionCell } from '../cells/tablet-action-cell'
import { FixtureAggregateCell } from '../cells/fixture-aggregate-cell'
import { TypeCell } from '../cells/type-cell'


interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
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

export function createTabletElectricianColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
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
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <TypeCell note={row.original} moduleType="electrician" />,
      enableSorting: false,
      enableResizing: false,
      size: 90,
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
      cell: ({ row }) => <TabletActionCell note={row.original} onStatusUpdate={onStatusUpdate} moduleType="electrician" />,
      enableSorting: false,
      enableResizing: false,
      size: 140,
    },
    {
      accessorKey: 'completedBy',
      header: 'Who Completed',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm text-muted-foreground">{value || ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 130,
    },
    {
      accessorKey: 'completedAt',
      header: 'When Completed',
      cell: ({ getValue }) => {
        const value = getValue() as Date | undefined
        return <span className="text-sm text-muted-foreground">{value ? formatDate(value) : ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 180,
    },
    {
      accessorKey: 'cancelledBy',
      header: 'Who Cancelled',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm text-muted-foreground">{value || ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 130,
    },
    {
      accessorKey: 'cancelledAt',
      header: 'When Cancelled',
      cell: ({ getValue }) => {
        const value = getValue() as Date | undefined
        return <span className="text-sm text-muted-foreground">{value ? formatDate(value) : ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 180,
    },
    {
      accessorKey: 'reviewedBy',
      header: 'Who Reviewed',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm text-muted-foreground">{value || ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 130,
    },
    {
      accessorKey: 'reviewedAt',
      header: 'When Reviewed',
      cell: ({ getValue }) => {
        const value = getValue() as Date | undefined
        return <span className="text-sm text-muted-foreground">{value ? formatDate(value) : ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 180,
    },
    {
      accessorKey: 'deletedByName',
      header: 'Who Deleted',
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        return <span className="text-sm text-muted-foreground">{value || ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 130,
    },
    {
      accessorKey: 'statusDeletedAt',
      header: 'When Deleted',
      cell: ({ getValue }) => {
        const value = getValue() as Date | undefined
        return <span className="text-sm text-muted-foreground">{value ? formatDate(value) : ''}</span>
      },
      enableSorting: false,
      enableResizing: false,
      size: 180,
    },
  ]
}
