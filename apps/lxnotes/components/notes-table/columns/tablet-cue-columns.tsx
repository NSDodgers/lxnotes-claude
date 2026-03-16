import { ColumnDef } from '@tanstack/react-table'
import { Note, NoteStatus } from '@/types'
import { TabletPriorityDot } from '../cells/tablet-priority-dot'
import { TabletActionCell } from '../cells/tablet-action-cell'
import { TypeColoredText } from '../cells/type-colored-text'

interface CreateColumnsOptions {
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
}

export function createTabletCueColumns({ onStatusUpdate }: CreateColumnsOptions): ColumnDef<Note>[] {
  return [
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <TabletPriorityDot note={row.original} moduleType="cue" />,
      enableSorting: false,
      enableResizing: false,
      size: 120,
    },
    {
      id: 'cueNumber',
      accessorFn: (row) => row.cueNumber,
      header: 'Cue #',
      cell: ({ row }) => (
        <TypeColoredText note={row.original} moduleType="cue" className="text-sm font-bold">{row.original.cueNumber || '-'}</TypeColoredText>
      ),
      enableSorting: false,
      enableResizing: false,
      size: 70,
    },
    {
      accessorKey: 'title',
      header: 'Note',
      cell: ({ row }) => (
        <TypeColoredText note={row.original} moduleType="cue" className="text-base font-medium break-words">{row.original.title}</TypeColoredText>
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
