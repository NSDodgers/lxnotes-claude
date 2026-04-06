'use client'

import { useCallback, useMemo } from 'react'
import { useProductionOptional } from '@/components/production/production-provider'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import type { EmailMessagePreset, PresetModuleType } from '@/types'

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
export function useProductionEmailPresets(moduleType: PresetModuleType) {
  const productionContext = useProductionOptional()
  const store = useEmailMessagePresetsStore()

  // Get system defaults for this module
  const systemPresets = useMemo(() => {
    return store.getPresetsByModule(moduleType).filter(p => p.id.startsWith('sys-'))
  }, [store, moduleType])

  // Get production presets for this module
  const emailPresets = productionContext?.production?.emailPresets
  const productionPresets = useMemo(() => {
    if (!emailPresets) return []
    return emailPresets.filter(
      p => p.moduleType === moduleType
    )
  }, [emailPresets, moduleType])

  // Merge presets: production presets override system presets with same ID
  const presets = useMemo(() => {
    // In demo / non-production mode, return the full local store list
    // (system defaults + user-created presets). Mirrors the behavior of
    // useProductionPrintPresets and useProductionFilterSortPresets — email
    // was the outlier that silently dropped local user presets, so users in
    // demo mode could create email presets but never see them back.
    if (!productionContext?.production) {
      return store.getPresetsByModule(moduleType)
    }

    // Production mode: start with system presets, then merge in production presets
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
  }, [systemPresets, productionPresets, productionContext?.production, store, moduleType])

  // Get a single preset by ID
  const getPreset = useCallback((id: string): EmailMessagePreset | undefined => {
    if (productionContext?.production) {
      // Production mode: check production presets first, then system
      const prodPreset = productionPresets.find(p => p.id === id)
      if (prodPreset) return prodPreset
      return systemPresets.find(p => p.id === id)
    }
    // Demo / non-production mode: full local store lookup (system + user)
    return store.getPreset(id)
  }, [productionContext?.production, productionPresets, systemPresets, store])

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
