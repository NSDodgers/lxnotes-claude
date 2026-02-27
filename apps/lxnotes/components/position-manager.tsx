'use client'

import { useState, useEffect } from 'react'
import { GripVertical, RotateCcw, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrentProductionStore } from '@/lib/stores/production-store'
import { usePositionStore } from '@/lib/stores/position-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableItemProps {
  id: string
  position: string
  index: number
}

function SortableItem({ id, position, index }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 bg-bg-secondary border rounded-lg
        ${isDragging ? 'opacity-50 shadow-lg z-10' : 'hover:bg-bg-tertiary'}
        transition-colors
      `}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-3 flex-1">
        <Badge variant="outline" className="text-xs">
          {index + 1}
        </Badge>
        <span className="font-medium">{position}</span>
      </div>
    </div>
  )
}

export function PositionManager() {
  const { name: productionName } = useCurrentProductionStore()
  const { getOrderedPositions, updateOrder, orders } = usePositionStore()
  const { getUniquePositions, lastPositionUpdate } = useFixtureStore()

  // Use a hardcoded production ID for demo - in real app this would come from context
  const productionId = 'prod-1'

  const [orderedPositions, setOrderedPositions] = useState<string[]>([])
  const [availablePositions, setAvailablePositions] = useState<string[]>([])
  const [showUpdateAlert, setShowUpdateAlert] = useState(false)

  // Get the current position order to check if it's from CSV
  const currentOrder = orders[productionId]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load data on component mount
  useEffect(() => {
    const unique = getUniquePositions(productionId)
    const ordered = getOrderedPositions(productionId)

    setAvailablePositions(unique)

    if (ordered.length > 0) {
      // Use custom order, but add any new positions not in the order
      const newPositions = unique.filter(pos => !ordered.includes(pos))
      setOrderedPositions([...ordered, ...newPositions])
    } else {
      // No custom order yet, use alphabetical
      setOrderedPositions([...unique].sort())
    }
  }, [productionId, getOrderedPositions, getUniquePositions])

  // Show alert when position updates occur
  useEffect(() => {
    if (lastPositionUpdate?.needsReview) {
      setShowUpdateAlert(true)
      // Refresh the data
      const unique = getUniquePositions(productionId)
      const ordered = getOrderedPositions(productionId)
      setAvailablePositions(unique)
      setOrderedPositions(ordered)
    }
  }, [lastPositionUpdate, getOrderedPositions, getUniquePositions, productionId])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOrderedPositions((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Save to store in next tick to avoid React warning - mark as custom since user manually reordered
        setTimeout(() => {
          updateOrder(productionId, newOrder, 'custom')
        }, 0)

        return newOrder
      })
    }
  }

  const handleResetOrder = () => {
    // Reset to alphabetical order
    const alphabetical = [...availablePositions].sort()
    setOrderedPositions(alphabetical)
    updateOrder(productionId, alphabetical, 'alphabetical')
  }

  const handleResetToCsvOrder = () => {
    // Reset to CSV order if available
    if (currentOrder?.positionOrderMap) {
      const csvOrdered = [...availablePositions].sort((a, b) => {
        const aOrder = currentOrder.positionOrderMap![a]
        const bOrder = currentOrder.positionOrderMap![b]

        if (aOrder !== undefined && bOrder !== undefined) {
          return aOrder - bOrder
        } else if (aOrder !== undefined && bOrder === undefined) {
          return -1
        } else if (aOrder === undefined && bOrder !== undefined) {
          return 1
        } else {
          return a.localeCompare(b)
        }
      })
      setOrderedPositions(csvOrdered)
      updateOrder(productionId, csvOrdered, 'csv')
    }
  }

  const exportOrder = () => {
    const data = orderedPositions.map((pos, index) => ({
      position: pos,
      sortOrder: index + 1
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `position-order-${productionName || 'production'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (availablePositions.length === 0) {
    return (
      <div className="text-center py-12">
        <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Position Data Found</h3>
        <p className="text-muted-foreground mb-4">
          Upload hookup CSV data to manage position sorting
        </p>
        <Button variant="outline" asChild>
          <a href="/work-notes">Go to Work Notes</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Update Alert */}
      {showUpdateAlert && lastPositionUpdate && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Position data updated:</strong>{' '}
              {lastPositionUpdate.addedPositions.length > 0 && (
                <span>Added {lastPositionUpdate.addedPositions.length} new positions. </span>
              )}
              {lastPositionUpdate.removedPositions.length > 0 && (
                <span>Removed {lastPositionUpdate.removedPositions.length} positions. </span>
              )}
              Your custom order has been preserved where possible.
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpdateAlert(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Position Sort Order</h2>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Drag and drop to customize the sort order for Work Notes
            </p>
            {currentOrder?.orderSource && (
              <Badge variant="outline" className="text-xs">
                {currentOrder.orderSource === 'csv' && 'From CSV'}
                {currentOrder.orderSource === 'custom' && 'Custom Order'}
                {currentOrder.orderSource === 'alphabetical' && 'A-Z'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportOrder}>
            <Download className="h-4 w-4 mr-2" />
            Export Order
          </Button>
          {currentOrder?.positionOrderMap && (
            <Button variant="outline" size="sm" onClick={handleResetToCsvOrder}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to CSV Order
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleResetOrder}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to A-Z
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-bg-secondary rounded-lg">
          <div className="text-2xl font-bold">{availablePositions.length}</div>
          <div className="text-sm text-muted-foreground">Total Positions</div>
        </div>
        <div className="text-center p-4 bg-bg-secondary rounded-lg">
          <div className="text-2xl font-bold">{orderedPositions.length}</div>
          <div className="text-sm text-muted-foreground">Ordered Positions</div>
        </div>
        <div className="text-center p-4 bg-bg-secondary rounded-lg">
          <div className="text-2xl font-bold">
            {lastPositionUpdate?.type === 'no_change' ? 'Up to date' : 'Updated'}
          </div>
          <div className="text-sm text-muted-foreground">Status</div>
        </div>
      </div>

      {/* Sortable List */}
      <div className="space-y-2">
        <h3 className="font-medium mb-4">
          Position Order (drag to reorder)
        </h3>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedPositions}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {orderedPositions.map((position, index) => (
                <SortableItem
                  key={position}
                  id={position}
                  position={position}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground bg-bg-secondary p-4 rounded-lg">
        <strong>How it works:</strong> This order will be used when sorting Work Notes by position.
        {currentOrder?.positionOrderMap && (
          <span> If your hookup CSV includes a &quot;Position Order&quot; column, that order is used as the starting point. </span>
        )}
        Positions not in your custom order will appear at the end, sorted alphabetically.
        Changes are saved automatically.
      </div>
    </div>
  )
}
