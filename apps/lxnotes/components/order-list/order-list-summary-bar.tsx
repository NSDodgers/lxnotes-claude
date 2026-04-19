'use client'

import type { AggregatedStats } from '@/hooks/use-aggregated-order-items'
import { Check } from 'lucide-react'

interface OrderListSummaryBarProps {
  stats: AggregatedStats
  compact?: boolean
}

export function OrderListSummaryBar({ stats, compact }: OrderListSummaryBarProps) {
  const percent = stats.total > 0 ? Math.round((stats.ordered / stats.total) * 100) : 0
  const allDone = stats.total > 0 && stats.remaining === 0

  if (compact) {
    return (
      <div className="flex-none bg-bg-secondary border-b border-bg-tertiary px-3 py-2">
        <div className="flex items-center justify-between text-[11px]" aria-live="polite">
          <span className="text-text-secondary">{stats.total} total</span>
          <span className="text-green-400">{stats.ordered} ordered</span>
          {allDone ? (
            <span className="flex items-center gap-1 text-green-400">
              <Check className="h-3 w-3" />
              All ordered
            </span>
          ) : (
            <span className="text-amber-400">{stats.remaining} remaining</span>
          )}
        </div>
        <div className="h-1 bg-zinc-800 rounded mt-1.5">
          <div
            className="h-1 bg-green-500 rounded transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 flex items-center gap-6" aria-live="polite">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] uppercase tracking-wide text-text-tertiary">Total Items</span>
        <span className="text-xl font-bold text-text-primary">{stats.total}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] uppercase tracking-wide text-text-tertiary">Ordered</span>
        <span className="text-xl font-bold text-green-400">{stats.ordered}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] uppercase tracking-wide text-text-tertiary">Remaining</span>
        {allDone ? (
          <span className="flex items-center gap-1.5 text-xl font-bold text-green-400">
            <Check className="h-5 w-5" />
            All ordered
          </span>
        ) : (
          <span className="text-xl font-bold text-amber-400">{stats.remaining}</span>
        )}
      </div>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded">
        <div
          className="h-1.5 bg-green-500 rounded transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
