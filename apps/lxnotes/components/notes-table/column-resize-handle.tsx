'use client'

import { Header } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface ColumnResizeHandleProps<TData> {
  header: Header<TData, unknown>
  className?: string
}

/**
 * Column resize handle component
 *
 * Provides visual handle for resizing table columns with:
 * - Mouse and touch event support
 * - Visual feedback on hover and during resize
 * - Double-click to reset column to default size
 */
export function ColumnResizeHandle<TData>({ header, className }: ColumnResizeHandleProps<TData>) {
  const isResizing = header.column.getIsResizing()

  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => header.column.resetSize()}
      className={cn(
        'resize-handle',
        isResizing && 'is-resizing',
        className
      )}
      onClick={(e) => {
        // Prevent sort from triggering when clicking resize handle
        e.stopPropagation()
      }}
    />
  )
}
