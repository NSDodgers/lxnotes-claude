import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { PrintPreset, ModuleType } from '@/types'
import { generateSystemPrintPresets } from '@/lib/utils/generate-dynamic-presets'
import { useFilterSortPresetsStore } from './filter-sort-presets-store'

interface PrintPresetsState {
  // Only stores user-created presets (system presets are computed dynamically)
  presets: PrintPreset[]
  loading: boolean

  // CRUD operations for user presets
  addPreset: (preset: Omit<PrintPreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<PrintPreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => PrintPreset | undefined

  // Returns all presets (system + user) for a module
  getPresetsByModule: (moduleType: ModuleType) => PrintPreset[]

  // Returns only dynamically generated system presets
  getSystemDefaults: () => PrintPreset[]

  // Utilities
  setLoading: (loading: boolean) => void
}

/**
 * Compute system print presets dynamically based on current filter presets.
 * Each filter preset gets a corresponding print preset.
 */
function computeSystemPrintPresets(moduleType: ModuleType): PrintPreset[] {
  // Get the dynamically generated filter presets for this module
  const filterPresets = useFilterSortPresetsStore.getState().getSystemDefaults(moduleType)

  return generateSystemPrintPresets(moduleType, filterPresets)
}

const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const usePrintPresetsStore = create<PrintPresetsState>()(
  persist(
    (set, get) => ({
      // Only user-created presets are stored (system presets computed on demand)
      presets: [],
      loading: false,

      addPreset: (presetData) => {
        const timestamp = new Date()
        const newPreset: PrintPreset = {
          ...presetData,
          id: `print-${Math.random().toString(36).substr(2, 9)}`,
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
          const systemPresets = computeSystemPrintPresets(moduleType)
          const systemPreset = systemPresets.find(p => p.id === id)
          if (systemPreset) return systemPreset
        }

        return undefined
      },

      getPresetsByModule: (moduleType) => {
        // Compute system presets dynamically (respects visible types/priorities)
        const systemPresets = computeSystemPrintPresets(moduleType)

        // Get user presets for this module
        const userPresets = get().presets.filter(preset => preset.moduleType === moduleType)

        // Return system presets first, then user presets
        return [...systemPresets, ...userPresets]
      },

      getSystemDefaults: () => {
        // Return all system presets across all modules
        const modules: ModuleType[] = ['cue', 'work', 'production']
        return modules.flatMap(moduleType => computeSystemPrintPresets(moduleType))
      },

      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'print-presets-storage',
      storage: createJSONStorage(() =>
        createSafeStorage(
          'print-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
      // Migrate old presets: filter out system presets (they're now computed)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as { presets?: PrintPreset[] }
        if (state?.presets) {
          // Remove system presets from stored data (they'll be computed dynamically)
          state.presets = state.presets.filter(p => !p.id.startsWith('sys-'))
        }
        return state as PrintPresetsState
      },
      version: 2,
    }
  )
)
