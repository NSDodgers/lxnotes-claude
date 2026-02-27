'use client'

import { useCallback, useMemo } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { usePrintPresetsStore } from '@/lib/stores/print-presets-store'
import type { PrintPreset, ModuleType } from '@/types'

/**
 * Hook that provides production-aware print presets.
 */
export function useProductionPrintPresets(moduleType: ModuleType) {
    const productionContext = useProductionOptional()
    const store = usePrintPresetsStore()

    // Re-filter correctly:
    // Store's getSystemDefaults() returns ALL defaults.
    // We want defaults for THIS module.
    const moduleSystemPresets = useMemo(() => {
        // We can just rely on the store to filter for us if we want, but store.getPresetsByModule includes user presets too.
        // Safer to re-implement filtering logic or trust getPresetsByModule(moduleType).filter(sys)
        return store.getPresetsByModule(moduleType).filter(p => p.id.startsWith('sys-'))
    }, [store, moduleType])


    // Get production presets for this module
    const productionPresets = useMemo(() => {
        if (!productionContext?.production?.printPresets) return []
        return productionContext.production.printPresets.filter(
            p => p.moduleType === moduleType
        )
    }, [productionContext?.production?.printPresets, moduleType])

    // Merge presets: production presets override system presets with same ID
    const presets = useMemo(() => {
        // Start with system presets
        const mergedPresets = [...moduleSystemPresets]

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

        if (!productionContext?.production) {
            return store.getPresetsByModule(moduleType)
        }

        return mergedPresets
    }, [moduleSystemPresets, productionPresets, productionContext?.production, store, moduleType])

    // Get a single preset by ID
    const getPreset = useCallback((id: string): PrintPreset | undefined => {
        if (productionContext?.production) {
            // Check production presets first
            const prodPreset = productionPresets.find(p => p.id === id)
            if (prodPreset) return prodPreset

            // Fall back to system preset
            return moduleSystemPresets.find(p => p.id === id)
        } else {
            return store.getPreset(id)
        }
    }, [productionContext?.production, productionPresets, moduleSystemPresets, store])

    // Save a preset (creates or updates)
    const savePreset = useCallback(async (preset: PrintPreset) => {
        if (productionContext?.updatePrintPreset) {
            // Save to production
            await productionContext.updatePrintPreset(preset)
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
        if (productionContext?.deletePrintPreset) {
            // Delete from production
            await productionContext.deletePrintPreset(presetId)
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
