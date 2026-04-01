'use client'

import { Package } from 'lucide-react'
import type { StatusFilter, ModuleFilter } from '@/hooks/use-aggregated-order-items'

interface OrderListEmptyStateProps {
  statusFilter: StatusFilter
  moduleFilter: ModuleFilter
  hasAnyItems: boolean
  onClearFilters: () => void
}

export function OrderListEmptyState({ statusFilter, moduleFilter, hasAnyItems, onClearFilters }: OrderListEmptyStateProps) {
  if (hasAnyItems) {
    // Filtered empty state
    const statusLabel = statusFilter === 'unordered' ? 'unordered' : 'ordered'
    const moduleLabel = moduleFilter === 'both' ? '' : ` in ${moduleFilter} notes`
    return (
      <div className="text-center py-12">
        <Package className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-sm text-text-tertiary">
          No {statusLabel} items{moduleLabel}
        </p>
        <button
          onClick={onClearFilters}
          className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          data-testid="order-list-clear-filters"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <Package className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
      <p className="text-sm text-text-secondary">No order items yet</p>
      <p className="text-xs text-text-tertiary mt-1">
        Add items to work or electrician notes to see them here.
      </p>
    </div>
  )
}
