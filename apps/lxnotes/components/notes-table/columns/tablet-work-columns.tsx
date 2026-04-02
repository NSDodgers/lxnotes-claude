import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { TabletPriorityDot } from '../cells/tablet-priority-dot'
import { TabletActionCell } from '../cells/tablet-action-cell'
import { FixtureAggregateCell } from '../cells/fixture-aggregate-cell'
import { CommentCountCell } from '../cells/comment-count-cell'


interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
}

export function createTabletWorkColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <TabletPriorityDot note={row.original} moduleType="work" />,
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
      id: 'comments',
      header: '',
      cell: ({ row }) => <CommentCountCell noteId={row.original.id} />,
      enableSorting: false,
      enableResizing: false,
      size: 50,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <TabletActionCell note={row.original} onStatusUpdate={onStatusUpdate} moduleType="work" />,
      enableSorting: false,
      enableResizing: false,
      size: 140,
    },
  ]
}
