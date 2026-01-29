'use client'

import { useCallback, useMemo } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import type { EmailMessagePreset, ModuleType } from '@/types'

/**
 * Hook that provides production-aware email presets.
 *
 * When in a production context:
 * - Returns production-specific presets merged with system defaults
 * - Saves/updates go to the production database
 *
 * When not in a production context (demo mode):
 * - Falls back to local Zustand store behavior
 */
export function useProductionEmailPresets(moduleType: ModuleType) {
  const productionContext = useProductionOptional()
  const store = useEmailMessagePresetsStore()

  // Get system defaults for this module
  const systemPresets = useMemo(() => {
    return store.getPresetsByModule(moduleType).filter(p => p.id.startsWith('sys-'))
  }, [store, moduleType])

  // Get production presets for this module
  const productionPresets = useMemo(() => {
    if (!productionContext?.production?.emailPresets) return []
    return productionContext.production.emailPresets.filter(
      p => p.moduleType === moduleType
    )
  }, [productionContext?.production?.emailPresets, moduleType])

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

    return mergedPresets
  }, [systemPresets, productionPresets])

  // Get a single preset by ID
  const getPreset = useCallback((id: string): EmailMessagePreset | undefined => {
    // Check production presets first
    const prodPreset = productionPresets.find(p => p.id === id)
    if (prodPreset) return prodPreset

    // Fall back to system preset
    return systemPresets.find(p => p.id === id)
  }, [productionPresets, systemPresets])

  // Save a preset (creates or updates)
  const savePreset = useCallback(async (preset: EmailMessagePreset) => {
    if (productionContext?.updateEmailPreset) {
      // Save to production
      await productionContext.updateEmailPreset(preset)
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
    if (productionContext?.deleteEmailPreset) {
      // Delete from production
      await productionContext.deleteEmailPreset(presetId)
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
    // Pass through utility functions from store
    getAvailablePlaceholders: store.getAvailablePlaceholders,
    resolvePlaceholders: store.resolvePlaceholders,
  }
}
