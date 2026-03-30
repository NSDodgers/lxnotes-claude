'use client'

import { useOrderItemsStore } from '@/lib/stores/order-items-store'

interface OrderItemsCellProps {
  noteId: string
}

/**
 * Cell component that displays order item counts for a note in the table view.
 * Shows "ordered/total" with a blue dot when there are unordered items.
 * Shows "—" when the note has no order items.
 */
export function OrderItemsCell({ noteId }: OrderItemsCellProps) {
  const counts = useOrderItemsStore(state => state.counts[noteId] || null)

  if (!counts || counts.total === 0) {
    return <span className="text-muted-foreground/50">—</span>
  }

  const hasUnordered = counts.ordered < counts.total

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-blue-400" data-testid={`order-items-count-${noteId}`}>
      {hasUnordered && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
      )}
      {counts.ordered}/{counts.total}
    </span>
  )
}
