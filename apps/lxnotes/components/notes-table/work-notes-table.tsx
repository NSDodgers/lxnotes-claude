'use client'

import { useMemo, useEffect, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Lock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { ModuleType, Note, NoteStatus } from '@/types'
import { createWorkColumns } from './columns/work-columns'
import { ColumnResizeHandle } from './column-resize-handle'
import { FreezeColumnMenu } from './freeze-column-menu'
import { useColumnConfig } from '@/hooks/use-column-config'
import { useColumnFreeze } from '@/hooks/use-column-freeze'
import type { InlineEditingState, EditableColumn } from '@/hooks/use-inline-editing'

const EDITABLE_COLUMNS = new Set<string>(['title', 'type', 'priority'])

interface WorkNotesTableProps {
  notes: Note[]
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onMoveModule?: (noteId: string, moduleType: ModuleType) => void
  onEdit?: (note: Note) => void
  onQuickAdd?: () => Promise<Note>
  emptyMessage?: string
  inlineEditing?: InlineEditingState & {
    startEditing: (noteId: string, column: EditableColumn, isNew?: boolean) => void
    stopEditing: () => void
    onSave: (noteId: string, column: EditableColumn, value: string) => void
    onAdvance: (column: EditableColumn) => void
    onCancel: (noteId: string, isNewNote: boolean) => void
  }
}

export function WorkNotesTable({ notes, onStatusUpdate, onMoveModule, onEdit, onQuickAdd, emptyMessage, inlineEditing }: WorkNotesTableProps) {
  const columns = useMemo(
    () => createWorkColumns({ onStatusUpdate, onMoveModule, inlineEditing }),
    [onStatusUpdate, onMoveModule, inlineEditing]
  )

  const { columnSizing, onColumnSizingChange, columnVisibility, columnOrder } = useColumnConfig('work')

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    maxMultiSortColCount: 2,
    columnResizeMode: 'onChange',
    initialState: {
      sorting: [
        { id: 'channels', desc: false }
      ]
    },
    state: {
      columnSizing,
      columnVisibility,
      columnOrder,
    },
    onColumnSizingChange,
  })

  const { frozenCount, freeze, unfreeze, headerRowRef, getFrozenHeaderStyle, getFrozenCellStyle, isLastFrozen } =
    useColumnFreeze('work')

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    }
  }, [])

  const handleCellClick = useCallback((note: Note, columnId: string, e: React.MouseEvent) => {
    if (inlineEditing && EDITABLE_COLUMNS.has(columnId)) {
      e.stopPropagation()
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null
        if (onEdit) onEdit(note)
      }, 250)
    } else if (onEdit) {
      onEdit(note)
    }
  }, [inlineEditing, onEdit])

  const handleCellDoubleClick = useCallback((note: Note, columnId: string, e: React.MouseEvent) => {
    if (inlineEditing && EDITABLE_COLUMNS.has(columnId)) {
      e.stopPropagation()
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }
      inlineEditing.startEditing(note.id, columnId as EditableColumn)
    }
  }, [inlineEditing])

  const handleQuickAddClick = useCallback(async () => {
    if (onQuickAdd && inlineEditing) {
      const newNote = await onQuickAdd()
      inlineEditing.startEditing(newNote.id, 'description', true)
    }
  }, [onQuickAdd, inlineEditing])

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
              <TableRow key={headerGroup.id} ref={headerRowRef}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()
                  const sortIndex = header.column.getSortIndex()
                  const frozenStyle = getFrozenHeaderStyle(headerIndex)
                  const lastFrozen = isLastFrozen(headerIndex)

                  return (
                    <FreezeColumnMenu
                      key={header.id}
                      columnIndex={headerIndex}
                      isFrozen={headerIndex < frozenCount}
                      onFreeze={freeze}
                      onUnfreeze={unfreeze}
                    >
                      <TableHead
                        className={cn(
                          'bg-bg-primary',
                          canSort && 'cursor-pointer hover:text-foreground transition-colors',
                          lastFrozen && 'frozen-last-col border-r border-border'
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        style={{
                          width: header.getSize(),
                          ...frozenStyle,
                        }}
                        suppressHydrationWarning
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {lastFrozen && <Lock className="h-3 w-3 opacity-40" />}
                            {canSort && renderSortIndicator(isSorted, sortIndex)}
                            {header.column.getCanResize() && (
                              <ColumnResizeHandle header={header} />
                            )}
                          </div>
                        )}
                      </TableHead>
                    </FreezeColumnMenu>
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
                  className={cn(
                    (onEdit || inlineEditing) && 'cursor-pointer',
                    inlineEditing?.editingNoteId === row.original.id && 'bg-muted/50'
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const frozenStyle = getFrozenCellStyle(cellIndex)
                    const lastFrozen = isLastFrozen(cellIndex)
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          frozenStyle && 'bg-bg-primary',
                          lastFrozen && 'frozen-last-col border-r border-border'
                        )}
                        style={{
                          width: cell.column.getSize(),
                          ...frozenStyle,
                        }}
                        suppressHydrationWarning
                        onClick={(e) => handleCellClick(row.original, cell.column.id, e)}
                        onDoubleClick={(e) => handleCellDoubleClick(row.original, cell.column.id, e)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage || 'No notes found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {onQuickAdd && (
          <div
            className="min-h-[200px] flex-1 cursor-pointer group"
            onClick={handleQuickAddClick}
            data-testid="work-quick-add-zone"
          >
            <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors">
              Click to add note...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
