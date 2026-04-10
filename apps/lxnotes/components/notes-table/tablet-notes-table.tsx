'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useColumnConfig } from '@/hooks/use-column-config'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import type { Note, ModuleType } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface TabletNotesTableProps {
  notes: Note[]
  columns: ColumnDef<Note>[]
  moduleType: ModuleType
  onEdit?: (note: Note) => void
  emptyIcon?: LucideIcon
  emptyMessage?: string
}

export function TabletNotesTable({
  notes,
  columns,
  moduleType,
  onEdit,
  emptyIcon: EmptyIcon,
  emptyMessage = 'No notes found',
}: TabletNotesTableProps) {
  const filterStatus = useNotesFilterStore((s) => s.filterStatus)
  const { columnVisibility, columnOrder } = useColumnConfig(moduleType, filterStatus)

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
      columnOrder,
    },
  })

  return (
    <div className="rounded-lg border overflow-hidden h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table data-testid="tablet-notes-table" className="table-fixed">
          <TableHeader className="sticky top-0 z-20 bg-bg-primary shadow-md border-b-2">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-bg-primary text-xs"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onEdit ? 'cursor-pointer' : ''}
                  onClick={onEdit ? (e: React.MouseEvent) => {
                    // Don't trigger edit if clicking on action buttons (touch devices may not stopPropagation reliably)
                    if ((e.target as HTMLElement).closest('button')) return
                    onEdit(row.original)
                  } : undefined}
                  style={{ minHeight: 56 }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3"
                      style={{ width: cell.column.getSize() }}
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
                  <div className="flex flex-col items-center gap-2">
                    {EmptyIcon && <EmptyIcon className="h-10 w-10 text-text-muted" />}
                    <p className="text-text-secondary">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
