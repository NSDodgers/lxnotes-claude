'use client'

import { useState } from 'react'
import { GripVertical, Eye, EyeOff, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MODULE_COLUMN_REGISTRY } from '@/lib/config/column-registry'
import { useColumnConfig } from '@/hooks/use-column-config'
import type { ModuleType } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableColumnRowProps {
  columnId: string
  label: string
  isHidden: boolean
  onToggle: (columnId: string) => void
}

function SortableColumnRow({ columnId, label, isHidden, onToggle }: SortableColumnRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md',
        isDragging ? 'opacity-50 shadow-lg z-10 bg-bg-secondary' : 'hover:bg-bg-tertiary',
        isHidden && 'opacity-40',
        'transition-all duration-150'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary p-0.5"
        aria-label={`Move ${label}. Use arrow keys to reorder.`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <span className={cn('text-sm flex-1', isHidden ? 'text-text-tertiary' : 'text-text-primary')}>
        {label}
      </span>
      <button
        onClick={() => onToggle(columnId)}
        className="p-1 rounded hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary"
        aria-label={`Toggle ${label} visibility`}
      >
        {isHidden ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}

interface ColumnConfigPopoverProps {
  moduleType: ModuleType
}

export function ColumnConfigPopover({ moduleType }: ColumnConfigPopoverProps) {
  const [open, setOpen] = useState(false)
  const { columnOrder, columnVisibility, toggleColumn, reorderColumns, resetColumnConfig } =
    useColumnConfig(moduleType)
  const registry = MODULE_COLUMN_REGISTRY[moduleType]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const hiddenSet = new Set(
    Object.entries(columnVisibility)
      .filter(([, vis]) => vis === false)
      .map(([id]) => id)
  )

  // Split into pinned (canHide=false) and customizable
  const pinnedColumns = registry.filter((c) => !c.canHide)
  const customizableIds = columnOrder.filter((id) => {
    const meta = registry.find((c) => c.id === id)
    return meta?.canHide
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = columnOrder.indexOf(active.id as string)
    const newIndex = columnOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...columnOrder]
    const [removed] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, removed)
    reorderColumns(newOrder)
  }

  function handleReset() {
    resetColumnConfig()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Configure columns"
          data-testid="column-config-trigger"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="p-0 w-[260px] max-h-[360px] flex flex-col"
      >
        {/* Header - fixed */}
        <div className="flex-none flex items-center justify-between px-3 py-2 border-b border-bg-tertiary">
            <span className="text-sm font-medium text-text-primary">Columns</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
              data-testid="column-config-reset"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {/* Always visible section */}
          <div className="px-1 py-1">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Always visible
            </span>
          </div>
          {pinnedColumns.map((col) => (
            <div
              key={col.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md"
            >
              <div className="w-[22px]" /> {/* spacer matching drag handle width */}
              <span className="text-sm flex-1 text-text-secondary">{col.label}</span>
              <div className="p-1 opacity-30">
                <Eye className="h-3.5 w-3.5 text-text-tertiary" />
              </div>
            </div>
          ))}

          {/* Customizable section */}
          <div className="px-1 py-1 mt-1">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Customizable
            </span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={customizableIds}
              strategy={verticalListSortingStrategy}
            >
              {customizableIds.map((colId) => {
                const meta = registry.find((c) => c.id === colId)
                if (!meta) return null
                return (
                  <SortableColumnRow
                    key={colId}
                    columnId={colId}
                    label={meta.label}
                    isHidden={hiddenSet.has(colId)}
                    onToggle={toggleColumn}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        </div>
      </PopoverContent>
    </Popover>
  )
}
