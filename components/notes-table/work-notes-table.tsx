'use client'

import { useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus } from '@/types'
import { createWorkColumns } from './columns/work-columns'
import { ColumnResizeHandle } from './column-resize-handle'
import { useColumnSizing } from '@/hooks/use-column-sizing'

interface WorkNotesTableProps {
  notes: Note[]
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onEdit?: (note: Note) => void
  onMountResetFn?: (resetFn: () => void) => void
}

export function WorkNotesTable({ notes, onStatusUpdate, onEdit, onMountResetFn }: WorkNotesTableProps) {
  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => createWorkColumns({ onStatusUpdate }),
    [onStatusUpdate]
  )

  // Column sizing state with localStorage persistence
  const { columnSizing, onColumnSizingChange, resetColumnSizes } = useColumnSizing('work')

  // Expose reset function to parent via callback on mount
  useEffect(() => {
    if (onMountResetFn) {
      onMountResetFn(resetColumnSizes)
    }
  }, [onMountResetFn, resetColumnSizes])

  // Create table instance with TanStack
  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Enable multi-sort (hold shift and click to add secondary sort)
    enableMultiSort: true,
    maxMultiSortColCount: 2,
    // Column resizing - onChange provides live visual feedback during drag
    columnResizeMode: 'onChange',
    // Default sort by channels ascending
    initialState: {
      sorting: [
        { id: 'channels', desc: false }
      ]
    },
    state: {
      columnSizing,
    },
    onColumnSizingChange,
  })

  /**
   * Renders the sort indicator for a header
   */
  function renderSortIndicator(isSorted: false | 'asc' | 'desc', sortIndex?: number) {
    if (!isSorted) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />
    }

    const isMultiSort = sortIndex !== undefined && sortIndex >= 0

    return (
      <div className="flex items-center gap-1">
        {isSorted === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        {isMultiSort && (
          <span className="text-xs font-bold">{sortIndex + 1}</span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table data-testid="notes-table" role="table">
          <TableHeader className="sticky top-0 z-20 bg-bg-primary shadow-md border-b-2">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()
                  const sortIndex = header.column.getSortIndex()

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'bg-bg-primary',
                        canSort && 'cursor-pointer hover:text-foreground transition-colors'
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{
                        width: header.getSize(),
                      }}
                      suppressHydrationWarning
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && renderSortIndicator(isSorted, sortIndex)}
                          {header.column.getCanResize() && (
                            <ColumnResizeHandle header={header} />
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onEdit ? 'cursor-pointer' : ''}
                  onClick={onEdit ? () => onEdit(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                      }}
                      suppressHydrationWarning
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No notes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}