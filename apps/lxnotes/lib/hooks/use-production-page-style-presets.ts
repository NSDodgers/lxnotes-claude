'use client'

import { useCallback, useMemo } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import type { PageStylePreset } from '@/types'

/**
 * Hook that provides production-aware page style presets.
 */
export function useProductionPageStylePresets() {
    const productionContext = useProductionOptional()
    const store = usePageStylePresetsStore()

    // Get system defaults
    const systemPresets = useMemo(() => {
        return store.getSystemDefaults()
    }, [store])

    // Get production presets
    const productionPresets = useMemo(() => {
        if (!productionContext?.production?.pageStylePresets) return []
        return productionContext.production.pageStylePresets
    }, [productionContext?.production?.pageStylePresets])

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

        if (!productionContext?.production) {
            // In demo/local mode, merge system defaults with local store presets
            // store.presets already includes system defaults + user presets
            return store.presets
        }

        return mergedPresets
    }, [systemPresets, productionPresets, productionContext?.production, store.presets])

    // Get a single preset by ID
    const getPreset = useCallback((id: string): PageStylePreset | undefined => {
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
    const savePreset = useCallback(async (preset: PageStylePreset) => {
        if (productionContext?.updatePageStylePreset) {
            // Save to production
            await productionContext.updatePageStylePreset(preset)
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
        if (productionContext?.deletePageStylePreset) {
            // Delete from production
            await productionContext.deletePageStylePreset(presetId)
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
