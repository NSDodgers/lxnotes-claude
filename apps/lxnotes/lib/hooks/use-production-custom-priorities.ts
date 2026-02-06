'use client'

import { useCallback } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { CustomPriority, ModuleType, SystemOverride } from '@/types'

/**
 * Hook that provides production-aware custom priorities management.
 *
 * When in a production context:
 * - Mutates Zustand store (synchronous, optimistic)
 * - Persists the full config to the production database
 *
 * When not in a production context (demo mode):
 * - Falls back to Zustand store with localStorage persistence
 */
export function useProductionCustomPriorities(moduleType: ModuleType) {
  const productionContext = useProductionOptional()
  const store = useCustomPrioritiesStore()

  const persistConfig = useCallback(async () => {
    if (productionContext?.updateCustomPrioritiesConfig) {
      try {
        const config = useCustomPrioritiesStore.getState().getConfig()
        await productionContext.updateCustomPrioritiesConfig(config)
      } catch (err) {
        console.warn('[useProductionCustomPriorities] Failed to persist config to DB:', err)
      }
    }
  }, [productionContext])

  const addCustomPriority = useCallback(async (
    priorityData: Omit<CustomPriority, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    store.addCustomPriority(moduleType, priorityData)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const updateCustomPriority = useCallback(async (id: string, updates: Partial<CustomPriority>) => {
    store.updateCustomPriority(moduleType, id, updates)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const deleteCustomPriority = useCallback(async (id: string) => {
    store.deleteCustomPriority(moduleType, id)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const overrideSystemDefault = useCallback(async (
    systemId: string,
    overrideData: SystemOverride['overrideData']
  ) => {
    store.overrideSystemDefault(moduleType, systemId, overrideData)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const resetSystemOverride = useCallback(async (systemId: string) => {
    store.resetSystemOverride(moduleType, systemId)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const reorderPriorities = useCallback(async (orderedIds: string[]) => {
    store.reorderPriorities(moduleType, orderedIds)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const insertPriorityBetween = useCallback(async (
    priorityData: Omit<CustomPriority, 'id' | 'createdAt' | 'updatedAt'>,
    beforeId: string,
    afterId: string
  ) => {
    store.insertPriorityBetween(moduleType, priorityData, beforeId, afterId)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  return {
    getSystemDefaults: store.getSystemDefaults,
    getPriorities: store.getPriorities,
    systemOverrides: store.systemOverrides,
    addCustomPriority,
    updateCustomPriority,
    deleteCustomPriority,
    overrideSystemDefault,
    resetSystemOverride,
    reorderPriorities,
    insertPriorityBetween,
    isProductionMode: !!productionContext?.production,
  }
}
