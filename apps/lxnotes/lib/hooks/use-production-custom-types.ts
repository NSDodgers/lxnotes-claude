'use client'

import { useCallback } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import type { CustomType, ModuleType, SystemOverride } from '@/types'

/**
 * Hook that provides production-aware custom types management.
 *
 * When in a production context:
 * - Mutates Zustand store (synchronous, optimistic)
 * - Persists the full config to the production database
 *
 * When not in a production context (demo mode):
 * - Falls back to Zustand store with localStorage persistence
 */
export function useProductionCustomTypes(moduleType: ModuleType) {
  const productionContext = useProductionOptional()
  const store = useCustomTypesStore()

  const persistConfig = useCallback(async () => {
    if (productionContext?.updateCustomTypesConfig) {
      try {
        const config = useCustomTypesStore.getState().getConfig()
        await productionContext.updateCustomTypesConfig(config)
      } catch (err) {
        console.warn('[useProductionCustomTypes] Failed to persist config to DB:', err)
      }
    }
  }, [productionContext])

  const addCustomType = useCallback(async (
    typeData: Omit<CustomType, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    store.addCustomType(moduleType, typeData)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const updateCustomType = useCallback(async (id: string, updates: Partial<CustomType>) => {
    store.updateCustomType(moduleType, id, updates)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  const deleteCustomType = useCallback(async (id: string) => {
    store.deleteCustomType(moduleType, id)
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

  const reorderTypes = useCallback(async (orderedIds: string[]) => {
    store.reorderTypes(moduleType, orderedIds)
    await persistConfig()
  }, [store, moduleType, persistConfig])

  return {
    getSystemDefaults: store.getSystemDefaults,
    getTypes: store.getTypes,
    systemOverrides: store.systemOverrides,
    addCustomType,
    updateCustomType,
    deleteCustomType,
    overrideSystemDefault,
    resetSystemOverride,
    reorderTypes,
    isProductionMode: !!productionContext?.production,
  }
}
