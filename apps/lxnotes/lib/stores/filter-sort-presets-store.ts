import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { FilterSortPreset, ModuleType } from '@/types'
import { generateSystemFilterPresets } from '@/lib/utils/generate-dynamic-presets'
import { useCustomTypesStore } from './custom-types-store'
import { useCustomPrioritiesStore } from './custom-priorities-store'

interface FilterSortPresetsState {
  // Only stores user-created presets (system presets are computed dynamically)
  presets: FilterSortPreset[]
  loading: boolean

  // CRUD operations for user presets
  addPreset: (preset: Omit<FilterSortPreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<FilterSortPreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => FilterSortPreset | undefined

  // Returns all presets (system + user) for a module
  getPresetsByModule: (moduleType: ModuleType) => FilterSortPreset[]

  // Returns only dynamically generated system presets
  getSystemDefaults: (moduleType: ModuleType) => FilterSortPreset[]

  // Utilities
  setLoading: (loading: boolean) => void
}

/**
 * Compute system filter presets dynamically based on current types/priorities stores.
 * This ensures presets stay in sync with visible types and priorities.
 */
function computeSystemPresets(moduleType: ModuleType): FilterSortPreset[] {
  // Access the stores directly to get current types and priorities
  const types = useCustomTypesStore.getState().getTypes(moduleType)
  const priorities = useCustomPrioritiesStore.getState().getPriorities(moduleType)

  return generateSystemFilterPresets(moduleType, types, priorities)
}

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const useFilterSortPresetsStore = create<FilterSortPresetsState>()(
  persist(
    (set, get) => ({
      // Only user-created presets are stored (system presets computed on demand)
      presets: [],
      loading: false,

      addPreset: (presetData) => {
        const timestamp = new Date()
        const newPreset: FilterSortPreset = {
          ...presetData,
          id: `filter-sort-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        set(state => ({
          presets: [...state.presets, newPreset]
        }))
      },

      updatePreset: (id, updates) => {
        // Don't allow updating system presets
        if (id.startsWith('sys-')) return

        set(state => ({
          presets: state.presets.map(preset =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date() }
              : preset
          )
        }))
      },

      deletePreset: (id) => {
        // Don't allow deleting system presets
        if (id.startsWith('sys-')) return

        set(state => ({
          presets: state.presets.filter(preset => preset.id !== id)
        }))
      },

      getPreset: (id) => {
        // Check user presets first
        const userPreset = get().presets.find(preset => preset.id === id)
        if (userPreset) return userPreset

        // Check system presets across all modules
        const modules: ModuleType[] = ['cue', 'work', 'production']
        for (const moduleType of modules) {
          const systemPresets = computeSystemPresets(moduleType)
          const systemPreset = systemPresets.find(p => p.id === id)
          if (systemPreset) return systemPreset
        }

        return undefined
      },

      getPresetsByModule: (moduleType) => {
        // Compute system presets dynamically (respects visible types/priorities)
        const systemPresets = computeSystemPresets(moduleType)

        // Get user presets for this module
        const userPresets = get().presets.filter(preset => preset.moduleType === moduleType)

        // Return system presets first, then user presets
        return [...systemPresets, ...userPresets]
      },

      getSystemDefaults: (moduleType) => {
        return computeSystemPresets(moduleType)
      },

      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'filter-sort-presets-storage',
      storage: createJSONStorage(() =>
        createSafeStorage(
          'filter-sort-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
      // Migrate old presets: filter out system presets (they're now computed)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as { presets?: FilterSortPreset[] }
        if (state?.presets) {
          // Remove system presets from stored data (they'll be computed dynamically)
          state.presets = state.presets.filter(p => !p.id.startsWith('sys-'))
        }
        return state as FilterSortPresetsState
      },
      version: 1,
    }
  )
)
