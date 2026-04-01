'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Package } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-mobile-detect'
import { useAggregatedOrderItems } from '@/hooks/use-aggregated-order-items'
import { OrderListSummaryBar } from './order-list-summary-bar'
import { OrderListFilterBar } from './order-list-filter-bar'
import { OrderListCard } from './order-list-card'
import { OrderListEmptyState } from './order-list-empty-state'
import { OrderListSkeleton } from './order-list-skeleton'

interface OrderListPageProps {
  productionId: string | undefined
}

const SESSION_STORAGE_KEY = 'lxnotes-order-list-state'

interface SavedState {
  statusFilter: string
  moduleFilter: string
  scrollTop: number
}

export function OrderListPage({ productionId }: OrderListPageProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    filteredGroups,
    stats,
    filteredStats,
    isLoading,
    statusFilter,
    moduleFilter,
    setStatusFilter,
    setModuleFilter,
    toggleOrdered,
  } = useAggregatedOrderItems(productionId)

  const isFiltered = statusFilter !== 'all' || moduleFilter !== 'both'

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!saved) return
      const state: SavedState = JSON.parse(saved)
      if (state.statusFilter) setStatusFilter(state.statusFilter as typeof statusFilter)
      if (state.moduleFilter) setModuleFilter(state.moduleFilter as typeof moduleFilter)
      if (state.scrollTop && scrollRef.current) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo(0, state.scrollTop)
        })
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // Ignore parse errors
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save state to sessionStorage before navigating away
  const saveState = useCallback(() => {
    const state: SavedState = {
      statusFilter,
      moduleFilter,
      scrollTop: scrollRef.current?.scrollTop || 0,
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))
  }, [statusFilter, moduleFilter])

  const handleOpenNote = useCallback((noteId: string, moduleType: string) => {
    saveState()
    const baseUrl = pathname.replace(/\/order-list$/, '')
    const moduleRoute = moduleType === 'electrician' ? '/electrician-notes' : '/work-notes'
    router.push(`${baseUrl}${moduleRoute}?editNote=${noteId}`)
  }, [pathname, router, saveState])

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all')
    setModuleFilter('both')
  }, [setStatusFilter, setModuleFilter])

  const isDemo = typeof window !== 'undefined' && window.location.pathname.startsWith('/demo')

  // No production selected (and not demo mode)
  if (!productionId && !isDemo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Select a production to view order items</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <Package className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-semibold text-text-primary">Order List</h1>
        </div>
        <OrderListSkeleton />
      </div>
    )
  }

  if (isMobile) {
    return (
      <div ref={scrollRef} className="flex flex-col h-full overflow-auto">
        <OrderListSummaryBar stats={stats} compact />
        <OrderListFilterBar
          statusFilter={statusFilter}
          moduleFilter={moduleFilter}
          onStatusChange={setStatusFilter}
          onModuleChange={setModuleFilter}
          stats={stats}
          filteredStats={filteredStats}
          isFiltered={isFiltered}
          compact
        />
        <div className="space-y-2 p-2 pb-20">
          {filteredGroups.length === 0 ? (
            <OrderListEmptyState
              statusFilter={statusFilter}
              moduleFilter={moduleFilter}
              hasAnyItems={stats.total > 0}
              onClearFilters={handleClearFilters}
            />
          ) : (
            filteredGroups.map(group => (
              <OrderListCard
                key={group.meta.noteId}
                group={group}
                onToggleOrdered={toggleOrdered}
                onOpenNote={handleOpenNote}
                defaultCollapsed={statusFilter === 'all' && group.orderedCount === group.totalCount}
                compact
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // Desktop
  return (
    <div ref={scrollRef} className="p-6 max-w-4xl overflow-auto h-full">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-5">
        <Package className="h-5 w-5 text-amber-400" />
        <h1 className="text-lg font-semibold text-text-primary">Order List</h1>
      </div>

      {/* Summary Bar */}
      <div className="mb-4">
        <OrderListSummaryBar stats={stats} />
      </div>

      {/* Filter Bar */}
      <div className="mb-5">
        <OrderListFilterBar
          statusFilter={statusFilter}
          moduleFilter={moduleFilter}
          onStatusChange={setStatusFilter}
          onModuleChange={setModuleFilter}
          stats={stats}
          filteredStats={filteredStats}
          isFiltered={isFiltered}
        />
      </div>

      {/* Cards or Empty State */}
      {filteredGroups.length === 0 ? (
        <OrderListEmptyState
          statusFilter={statusFilter}
          moduleFilter={moduleFilter}
          hasAnyItems={stats.total > 0}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(group => (
            <OrderListCard
              key={group.meta.noteId}
              group={group}
              onToggleOrdered={toggleOrdered}
              onOpenNote={handleOpenNote}
              defaultCollapsed={statusFilter === 'all' && group.orderedCount === group.totalCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
