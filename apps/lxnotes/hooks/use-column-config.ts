'use client'

import { useMemo, useCallback } from 'react'
import { ColumnSizingState, OnChangeFn, VisibilityState } from '@tanstack/react-table'
import { useColumnLayoutStore, mergeColumnOrderWithRegistry } from '@/lib/stores/column-layout-store'
import { MODULE_COLUMN_REGISTRY } from '@/lib/config/column-registry'
import type { ModuleType } from '@/types'

interface UseColumnConfigReturn {
  // Column sizing (consolidated from use-column-sizing)
  columnSizing: ColumnSizingState
  onColumnSizingChange: OnChangeFn<ColumnSizingState>
  // Column visibility
  columnVisibility: VisibilityState
  // Column order
  columnOrder: string[]
  // Actions
  toggleColumn: (columnId: string) => void
  reorderColumns: (orderedIds: string[]) => void
  resetColumnConfig: () => void
}

export function useColumnConfig(moduleType: ModuleType): UseColumnConfigReturn {
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

  // Column visibility - derive from hiddenColumns
  const columnVisibility = useMemo<VisibilityState>(() => {
    const hidden = new Set(layout?.hiddenColumns ?? [])
    const vis: VisibilityState = {}
    for (const col of registry) {
      if (hidden.has(col.id)) {
        vis[col.id] = false
      }
    }
    return vis
  }, [layout?.hiddenColumns, registry])

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
    toggleColumn,
    reorderColumns,
    resetColumnConfig,
  }
}
