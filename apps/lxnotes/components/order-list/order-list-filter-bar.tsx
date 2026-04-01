'use client'

import { cn } from '@/lib/utils'
import type { StatusFilter, ModuleFilter, AggregatedStats } from '@/hooks/use-aggregated-order-items'

interface OrderListFilterBarProps {
  statusFilter: StatusFilter
  moduleFilter: ModuleFilter
  onStatusChange: (f: StatusFilter) => void
  onModuleChange: (f: ModuleFilter) => void
  stats: AggregatedStats
  filteredStats: AggregatedStats
  isFiltered: boolean
  compact?: boolean
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unordered', label: 'Unordered' },
  { value: 'ordered', label: 'Ordered' },
]

const MODULE_OPTIONS: { value: ModuleFilter; label: string; colorClass: string }[] = [
  { value: 'both', label: 'Both', colorClass: 'border-amber-400/30 text-amber-400 bg-amber-400/10' },
  { value: 'work', label: 'Work', colorClass: 'border-blue-400/30 text-blue-400 bg-blue-400/10' },
  { value: 'electrician', label: 'Electrician', colorClass: 'border-cyan-400/30 text-cyan-400 bg-cyan-400/10' },
]

function getStatusCount(stats: AggregatedStats, status: StatusFilter): number {
  switch (status) {
    case 'all': return stats.total
    case 'unordered': return stats.remaining
    case 'ordered': return stats.ordered
  }
}

export function OrderListFilterBar({
  statusFilter,
  moduleFilter,
  onStatusChange,
  onModuleChange,
  stats,
  filteredStats,
  isFiltered,
  compact,
}: OrderListFilterBarProps) {
  return (
    <div className={cn(
      'flex items-center gap-3',
      compact && 'flex-none bg-bg-secondary border-b border-bg-tertiary'
    )}>
      <div className={cn(
        'flex items-center gap-1',
        compact ? 'px-2 py-1.5 overflow-x-auto' : 'gap-3'
      )}>
        {/* Status toggle */}
        <div className="flex bg-bg-secondary border border-bg-tertiary rounded-md overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={cn(
                'px-3 py-1 text-xs transition-colors border-r border-bg-tertiary last:border-r-0',
                compact && 'px-2 h-7 text-[11px]',
                statusFilter === opt.value
                  ? 'bg-bg-tertiary text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
              data-testid={`order-list-filter-${opt.value}`}
            >
              {opt.label} ({getStatusCount(stats, opt.value)})
            </button>
          ))}
        </div>

        {/* Module filter badges */}
        {MODULE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onModuleChange(opt.value)}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded border transition-colors',
              compact && 'h-7',
              moduleFilter === opt.value
                ? opt.colorClass
                : 'border-bg-tertiary text-text-tertiary hover:text-text-secondary'
            )}
            data-testid={`order-list-module-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}

        {/* "Showing X of Y" when filtered */}
        {isFiltered && (
          <span className="text-[11px] text-text-tertiary ml-2 whitespace-nowrap">
            Showing {filteredStats.total} of {stats.total}
          </span>
        )}
      </div>
    </div>
  )
}
