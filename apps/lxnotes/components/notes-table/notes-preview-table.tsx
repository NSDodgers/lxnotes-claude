'use client'

import { useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Note, ModuleType } from '@/types'
import { CheckSquare, Square, XSquare } from 'lucide-react'
import {
  formatChannels,
  formatPositionUnit,
  formatDepartment,
} from '@/lib/utils/pdf-formatters'
import { useCueLookup } from '@/lib/services/cue-lookup'

interface NotesPreviewTableProps {
  notes: Note[]
  moduleType: ModuleType
  showCheckboxes: boolean
}

const columnHelper = createColumnHelper<Note>()

/**
 * Simplified read-only table for PDF preview
 * Shows filtered and sorted notes without interactive features
 */
export function NotesPreviewTable({ notes, moduleType, showCheckboxes }: NotesPreviewTableProps) {
  const { lookupCue } = useCueLookup()

  // Build cue location display (matches main table logic)
  const buildCueLocationDisplay = useCallback((note: Note): string => {
    const formatLookup = (cueNumber: string) => {
      const lookup = lookupCue(cueNumber)
      return lookup.display || '-'
    }

    if (note.cueNumber) {
      return formatLookup(note.cueNumber)
    }

    if (note.scriptPageId) {
      if (note.scriptPageId.startsWith('cue-')) {
        return formatLookup(note.scriptPageId.replace('cue-', ''))
      }

      if (note.scriptPageId.startsWith('page-')) {
        const pageLabel = `Pg. ${note.scriptPageId.replace('page-', '')}`
        return note.sceneSongId ? `${pageLabel} – ${note.sceneSongId}` : pageLabel
      }

      return note.scriptPageId
    }

    return '-'
  }, [lookupCue])

  // Create columns matching PDF structure
  const columns = useMemo(() => {
    const cols = []

    // Checkbox column (optional)
    if (showCheckboxes) {
      cols.push(
        columnHelper.display({
          id: 'checkbox',
          size: 40,
          header: () => <Square className="h-4 w-4 text-muted-foreground" />,
          cell: () => <Square className="h-4 w-4 text-muted-foreground" />
        })
      )
    }

    // Status icon column (preview only, not in PDF)
    cols.push(
      columnHelper.accessor('status', {
        id: 'status',
        size: 40,
        header: '',
        cell: ({ getValue }) => {
          const status = getValue()
          if (status === 'complete') {
            return <CheckSquare className="h-4 w-4 text-green-500" />
          } else if (status === 'cancelled') {
            return <XSquare className="h-4 w-4 text-muted-foreground" />
          }
          return <Square className="h-4 w-4 text-blue-500" />
        }
      })
    )

    // Priority column
    cols.push(
      columnHelper.accessor('priority', {
        id: 'priority',
        size: 80,
        header: 'Priority',
        cell: ({ getValue }) => {
          const priority = getValue()
          const colorClass = priority === 'high'
            ? 'bg-red-500'
            : priority === 'medium'
              ? 'bg-orange-500'
              : 'bg-green-500'

          return (
            <span className={cn(
              'px-2 py-1 rounded text-xs text-white font-medium',
              colorClass
            )}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          )
        }
      })
    )

    // Type column (all modules have this)
    cols.push(
      columnHelper.accessor('type', {
        id: 'type',
        size: 100,
        header: moduleType === 'production' ? 'Department' : 'Type',
        cell: ({ getValue }) => (
          <div className="text-sm text-muted-foreground truncate">
            {getValue() ? formatDepartment(getValue()) : '—'}
          </div>
        )
      })
    )

    // Module-specific columns
    if (moduleType === 'cue') {
      // Cue # column
      cols.push(
        columnHelper.accessor('cueNumber', {
          id: 'cueNumber',
          size: 80,
          header: 'Cue #',
          cell: ({ getValue }) => (
            <div className="text-sm text-muted-foreground">
              {getValue() || '-'}
            </div>
          )
        })
      )

      // Script Page - Scene/Song column (matches main table)
      cols.push(
        columnHelper.display({
          id: 'cueLocation',
          size: 200,
          header: 'Script Page - Scene/Song',
          cell: ({ row }) => {
            const note = row.original
            return (
              <div className="text-sm text-muted-foreground">
                {buildCueLocationDisplay(note)}
              </div>
            )
          }
        })
      )
    } else if (moduleType === 'work') {
      // Channels column
      cols.push(
        columnHelper.accessor('channelNumbers', {
          id: 'channelNumbers',
          size: 80,
          header: 'Channels',
          cell: ({ getValue }) => (
            <div className="text-sm text-muted-foreground">
              {formatChannels(getValue())}
            </div>
          )
        })
      )

      // Position/Unit column
      cols.push(
        columnHelper.accessor('positionUnit', {
          id: 'positionUnit',
          size: 120,
          header: 'Position/Unit',
          cell: ({ getValue }) => (
            <div className="text-sm text-muted-foreground">
              {formatPositionUnit(getValue())}
            </div>
          )
        })
      )
    }
    // Production notes don't have additional module-specific columns

    // Note column (combines title and description like PDF)
    cols.push(
      columnHelper.display({
        id: 'note',
        size: 300,
        header: 'Note',
        cell: ({ row }) => {
          const note = row.original
          const noteText = note.description
            ? `${note.title}: ${note.description}`
            : note.title
          return (
            <div className="text-sm text-muted-foreground">
              {noteText}
            </div>
          )
        }
      })
    )

    // Created column
    cols.push(
      columnHelper.display({
        id: 'created',
        size: 100,
        header: 'Created',
        cell: ({ row }) => {
          const note = row.original
          const date = note.createdAt ? new Date(note.createdAt) : new Date()
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const month = months[date.getMonth()]
          const day = date.getDate()
          const year = date.getFullYear().toString().slice(-2)
          return (
            <div className="text-sm text-muted-foreground">
              {`${month} ${day}, ${year}`}
            </div>
          )
        }
      })
    )

    return cols
  }, [showCheckboxes, moduleType, buildCueLocationDisplay])

  // Create table instance
  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 bg-bg-tertiary">
        <p className="text-center text-muted-foreground text-sm">
          No notes match the selected filter
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-bg-tertiary">
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-bg-secondary z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-foreground font-semibold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className="hover:bg-bg-secondary/50"
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="py-2"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
