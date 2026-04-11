'use client'

import { useMemo, useCallback } from 'react'
import { ColumnSizingState, OnChangeFn, SortingState, VisibilityState } from '@tanstack/react-table'
import { useColumnLayoutStore, mergeColumnOrderWithRegistry } from '@/lib/stores/column-layout-store'
import { MODULE_COLUMN_REGISTRY } from '@/lib/config/column-registry'
import type { ModuleType, NoteStatus } from '@/types'

/** Columns to auto-hide based on the active status filter.
 * Each status only shows its own tracking columns (plus created where relevant). */
const STATUS_HIDDEN_COLUMNS: Record<NoteStatus, string[]> = {
  todo: ['cancelledBy', 'cancelledAt', 'createdBy', 'createdAt', 'completedBy', 'completedAt', 'reviewedBy', 'reviewedAt', 'deletedByName', 'statusDeletedAt'],
  review: ['cancelledBy', 'cancelledAt', 'completedBy', 'completedAt', 'deletedByName', 'statusDeletedAt'],
  complete: ['cancelledBy', 'cancelledAt', 'reviewedBy', 'reviewedAt', 'deletedByName', 'statusDeletedAt'],
  cancelled: ['completedBy', 'completedAt', 'reviewedBy', 'reviewedAt', 'deletedByName', 'statusDeletedAt'],
  deleted: ['cancelledBy', 'cancelledAt', 'completedBy', 'completedAt', 'reviewedBy', 'reviewedAt'],
}

const DEFAULT_SORTING: Record<ModuleType, SortingState> = {
  work: [{ id: 'priority', desc: true }],
  electrician: [{ id: 'priority', desc: true }],
  cue: [{ id: 'cueNumber', desc: false }],
  production: [{ id: 'createdAt', desc: true }],
}

interface UseColumnConfigReturn {
  // Column sizing (consolidated from use-column-sizing)
  columnSizing: ColumnSizingState
  onColumnSizingChange: OnChangeFn<ColumnSizingState>
  // Column visibility
  columnVisibility: VisibilityState
  // Column order
  columnOrder: string[]
  // Sorting
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  // Actions
  toggleColumn: (columnId: string) => void
  reorderColumns: (orderedIds: string[]) => void
  resetColumnConfig: () => void
}

export function useColumnConfig(moduleType: ModuleType, statusFilter?: NoteStatus): UseColumnConfigReturn {
  const store = useColumnLayoutStore()
  const layout = store.getModuleLayout(moduleType)
  const registry = MODULE_COLUMN_REGISTRY[moduleType]

  // Column sizing - read from store widths
  const columnSizing = useMemo<ColumnSizingState>(() => {
    return layout?.widths ?? {}
  }, [layout?.widths])

  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = useCallback(
    (updaterOrValue) => {
      const newValue =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(store.getModuleLayout(moduleType)?.widths ?? {})
          : updaterOrValue

      // Write individual widths to store
      for (const [columnId, width] of Object.entries(newValue)) {
        store.setColumnWidth(moduleType, columnId, width)
      }
    },
    [store, moduleType]
  )

  // Column order - merge with registry to handle new columns
  const columnOrder = useMemo(() => {
    return mergeColumnOrderWithRegistry(layout?.columnOrder ?? null, moduleType)
  }, [layout?.columnOrder, moduleType])

  // Column visibility - derive from hiddenColumns + status-based auto-hides
  const columnVisibility = useMemo<VisibilityState>(() => {
    const hidden = new Set(layout?.hiddenColumns ?? [])
    const statusHidden = statusFilter ? new Set(STATUS_HIDDEN_COLUMNS[statusFilter]) : new Set<string>()
    const vis: VisibilityState = {}
    for (const col of registry) {
      if (hidden.has(col.id) || statusHidden.has(col.id)) {
        vis[col.id] = false
      }
    }
    return vis
  }, [layout?.hiddenColumns, registry, statusFilter])

  // Sorting - read from store or use module default
  const sorting = useMemo<SortingState>(() => {
    return store.getSorting(moduleType) ?? DEFAULT_SORTING[moduleType] ?? []
  }, [store.getSorting(moduleType), moduleType])

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updaterOrValue) => {
      const newValue =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(store.getSorting(moduleType) ?? DEFAULT_SORTING[moduleType] ?? [])
          : updaterOrValue
      store.setSorting(moduleType, newValue)
    },
    [store, moduleType]
  )

  const toggleColumn = useCallback(
    (columnId: string) => {
      store.toggleColumnVisibility(moduleType, columnId)
    },
    [store, moduleType]
  )

  const reorderColumns = useCallback(
    (orderedIds: string[]) => {
      store.setColumnOrder(moduleType, orderedIds)
    },
    [store, moduleType]
  )

  const resetColumnConfig = useCallback(() => {
    store.resetModuleLayout(moduleType)
  }, [store, moduleType])

  return {
    columnSizing,
    onColumnSizingChange,
    columnVisibility,
    columnOrder,
    sorting,
    onSortingChange,
    toggleColumn,
    reorderColumns,
    resetColumnConfig,
  }
}
