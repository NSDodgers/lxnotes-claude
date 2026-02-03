'use client'

import { useCallback, useMemo } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import type { FilterSortPreset, ModuleType } from '@/types'

/**
 * Hook that provides production-aware filter/sort presets.
 */
export function useProductionFilterSortPresets(moduleType: ModuleType) {
    const productionContext = useProductionOptional()
    const store = useFilterSortPresetsStore()

    // Get system defaults for this module
    const systemPresets = useMemo(() => {
        return store.getSystemDefaults(moduleType)
    }, [store, moduleType])

    // Get production presets for this module
    const productionPresets = useMemo(() => {
        if (!productionContext?.production?.filterSortPresets) return []
        return productionContext.production.filterSortPresets.filter(
            p => p.moduleType === moduleType
        )
    }, [productionContext?.production?.filterSortPresets, moduleType])

    // Merge presets: production presets override system presets with same ID
    const presets = useMemo(() => {
        // Start with system presets
        const mergedPresets = [...systemPresets]

        // Add or replace with production presets
        for (const prodPreset of productionPresets) {
            const existingIndex = mergedPresets.findIndex(p => p.id === prodPreset.id)
            if (existingIndex >= 0) {
                // Replace system preset with production customization
                mergedPresets[existingIndex] = prodPreset
            } else {
                // Add production-only preset
                mergedPresets.push(prodPreset)
            }
        }

        // Also include user local presets if not in production mode provided by store?
        // Actually store.presets contains user local presets. We should merge those too if NOT in production mode.
        // But if in production mode, we usually ignore local-only presets to avoid confusion?
        // For consistency with email presets hook:
        // If not in production mode, we rely on the store.

        if (!productionContext?.production) {
            // In demo/local mode, use the store's full list (system + user local)
            return store.getPresetsByModule(moduleType)
        }

        return mergedPresets
    }, [systemPresets, productionPresets, productionContext?.production, store, moduleType])

    // Get a single preset by ID
    const getPreset = useCallback((id: string): FilterSortPreset | undefined => {
        if (productionContext?.production) {
            // Check production presets first
            const prodPreset = productionPresets.find(p => p.id === id)
            if (prodPreset) return prodPreset

            // Fall back to system preset
            return systemPresets.find(p => p.id === id)
        } else {
            return store.getPreset(id)
        }
    }, [productionContext?.production, productionPresets, systemPresets, store])

    // Save a preset (creates or updates)
    const savePreset = useCallback(async (preset: FilterSortPreset) => {
        if (productionContext?.updateFilterSortPreset) {
            // Save to production
            await productionContext.updateFilterSortPreset(preset)
        } else {
            // Fall back to local store (demo mode)
            if (store.getPreset(preset.id)) {
                store.updatePreset(preset.id, preset)
            } else {
                store.addPreset(preset)
            }
        }
    }, [productionContext, store])

    // Delete a preset
    const deletePreset = useCallback(async (presetId: string) => {
        if (productionContext?.deleteFilterSortPreset) {
            // Delete from production
            await productionContext.deleteFilterSortPreset(presetId)
        } else {
            // Fall back to local store (demo mode)
            store.deletePreset(presetId)
        }
    }, [productionContext, store])

    // Check if we're in production mode
    const isProductionMode = !!productionContext?.production

    return {
        presets,
        getPreset,
        savePreset,
        deletePreset,
        isProductionMode,
    }
}
